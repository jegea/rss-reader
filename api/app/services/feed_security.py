import ipaddress
import socket
from urllib.parse import urljoin, urlsplit

import httpx

MAX_REDIRECTS = 5
MAX_FEED_SIZE = 5 * 1024 * 1024
FEED_TIMEOUT = 15.0

REDIRECT_STATUSES = {301, 302, 303, 307, 308}


class FeedSecurityError(Exception):
    """Raised when a feed URL points to an unsafe destination."""


def resolve_public_addresses(url: str) -> list[str]:
    try:
        parsed_url = urlsplit(url)
        scheme = parsed_url.scheme.lower()
        hostname = parsed_url.hostname
        port = parsed_url.port
    except ValueError as exc:
        raise FeedSecurityError("Invalid feed URL.") from exc

    if scheme not in {"http", "https"}:
        raise FeedSecurityError("Only HTTP and HTTPS URLs are allowed.")

    if parsed_url.username or parsed_url.password:
        raise FeedSecurityError("URLs containing credentials are not allowed.")

    if not hostname or "%" in hostname:
        raise FeedSecurityError("Invalid URL hostname.")

    if port is None:
        port = 443 if scheme == "https" else 80

    try:
        ip = ipaddress.ip_address(hostname)
        addresses = [ip]
    except ValueError:
        try:
            results = socket.getaddrinfo(
                hostname,
                port,
                family=socket.AF_UNSPEC,
                type=socket.SOCK_STREAM,
            )
        except OSError as exc:
            raise FeedSecurityError(
                "Could not resolve the URL hostname."
            ) from exc

        addresses = set()

        for result in results:
            resolved_address = result[4][0]

            if "%" in resolved_address:
                raise FeedSecurityError(
                    "Scoped IP addresses are not allowed."
                )

            try:
                addresses.add(ipaddress.ip_address(resolved_address))
            except ValueError as exc:
                raise FeedSecurityError(
                    "DNS returned an invalid IP address."
                ) from exc

    if not addresses:
        raise FeedSecurityError("The hostname has no valid IP addresses.")

    for address in addresses:
        if not address.is_global:
            raise FeedSecurityError(
                "The URL resolves to a non-public IP address."
            )

    return sorted(str(address) for address in addresses)


class PinnedIPTransport(httpx.HTTPTransport):
    """Connects to a validated IP while preserving the original hostname."""

    def __init__(self, ip_address: str):
        super().__init__(retries=0)
        self.ip_address = ip_address

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        original_host = request.url.host
        original_port = request.url.port
        scheme = request.url.scheme

        request.url = request.url.copy_with(host=self.ip_address)

        host_header = original_host

        if ":" in original_host and not original_host.startswith("["):
            host_header = f"[{original_host}]"

        default_port = 443 if scheme == "https" else 80

        if original_port is not None and original_port != default_port:
            host_header = f"{host_header}:{original_port}"

        request.headers["Host"] = host_header

        try:
            ipaddress.ip_address(original_host)
        except ValueError:
            if scheme == "https":
                request.extensions["sni_hostname"] = original_host

        return super().handle_request(request)


def download_feed(
    url: str,
    headers: dict[str, str] | None = None,
) -> httpx.Response:
    current_url = url
    request_headers = headers or {}

    for redirect_count in range(MAX_REDIRECTS + 1):
        addresses = resolve_public_addresses(current_url)

        response = None
        last_error = None

        for address in addresses:
            transport = PinnedIPTransport(address)

            try:
                with httpx.Client(
                    transport=transport,
                    timeout=FEED_TIMEOUT,
                    follow_redirects=False,
                    trust_env=False,
                ) as client, client.stream(
                    "GET",
                    current_url,
                    headers=request_headers,
                ) as streamed_response:
                    status_code = streamed_response.status_code
                    response_headers = dict(streamed_response.headers)

                    if status_code not in REDIRECT_STATUSES:
                        body = bytearray()

                        for chunk in streamed_response.iter_bytes():
                            if len(body) + len(chunk) > MAX_FEED_SIZE:
                                raise FeedSecurityError(
                                    "Feed response exceeds the maximum size."
                                )

                            body.extend(chunk)

                response = httpx.Response(
                    status_code=status_code,
                    headers=response_headers,
                    content=bytes(body) if status_code not in REDIRECT_STATUSES else b"",
                    request=httpx.Request("GET", current_url),
                )

                break

            except (httpx.ConnectError, httpx.ConnectTimeout) as exc:
                last_error = exc

        if response is None:
            if last_error is not None:
                raise last_error

            raise FeedSecurityError("Could not connect to the feed server.")

        if response.status_code not in REDIRECT_STATUSES:
            return response

        if redirect_count == MAX_REDIRECTS:
            raise FeedSecurityError("Too many feed redirects.")

        location = response.headers.get("Location")

        if not location:
            raise FeedSecurityError("Redirect response has no Location header.")

        next_url = urljoin(current_url, location)

        if get_url_origin(current_url) != get_url_origin(next_url):
            request_headers = {
                key: value
                for key, value in request_headers.items()
                if key.lower() not in {"if-none-match", "if-modified-since"}
            }

        current_url = next_url

    raise FeedSecurityError("Could not download the feed.")


def get_url_origin(url: str) -> tuple[str, str, int]:
    parsed_url = urlsplit(url)
    scheme = parsed_url.scheme.lower()
    port = parsed_url.port or (443 if scheme == "https" else 80)

    return scheme, parsed_url.hostname or "", port