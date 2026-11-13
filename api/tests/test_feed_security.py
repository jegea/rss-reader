import socket

import httpx
import pytest

from app.services.feed_security import (
    MAX_FEED_SIZE,
    FeedSecurityError,
    download_feed,
    resolve_public_addresses,
)


def test_accepts_public_ip_address():
    result = resolve_public_addresses("https://8.8.8.8/feed.xml")

    assert result == ["8.8.8.8"]


def test_rejects_private_ip_address():
    with pytest.raises(FeedSecurityError):
        resolve_public_addresses("http://192.168.1.10/feed.xml")


def test_rejects_localhost():
    with pytest.raises(FeedSecurityError):
        resolve_public_addresses("http://127.0.0.1/feed.xml")


def test_rejects_unsupported_scheme():
    with pytest.raises(FeedSecurityError):
        resolve_public_addresses("ftp://example.com/feed.xml")


def test_rejects_url_with_credentials():
    with pytest.raises(FeedSecurityError):
        resolve_public_addresses("https://user:password@example.com/feed.xml")


def test_accepts_hostname_with_public_ip(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        return [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                ("8.8.8.8", 443),
            )
        ]

    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)

    result = resolve_public_addresses("https://example.com/feed.xml")

    assert result == ["8.8.8.8"]


def test_rejects_hostname_with_private_ip(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        return [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                ("192.168.1.10", 443),
            )
        ]

    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)

    with pytest.raises(FeedSecurityError):
        resolve_public_addresses("https://example.com/feed.xml")


def test_rejects_hostname_with_mixed_public_and_private_ips(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        return [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                ("8.8.8.8", 443),
            ),
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                ("192.168.1.10", 443),
            ),
        ]

    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)

    with pytest.raises(FeedSecurityError):
        resolve_public_addresses("https://example.com/feed.xml")


def test_rejects_hostname_when_dns_resolution_fails(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        raise socket.gaierror("DNS resolution failed")

    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)

    with pytest.raises(FeedSecurityError):
        resolve_public_addresses("https://example.com/feed.xml")


def test_download_feed_returns_content(monkeypatch):
    feed_content = b"<rss><channel><title>Test Feed</title></channel></rss>"

    def handler(request):
        return httpx.Response(
            200,
            content=feed_content,
            headers={"ETag": '"abc123"'},
            request=request,
        )

    monkeypatch.setattr(
        "app.services.feed_security.resolve_public_addresses",
        lambda url: ["93.184.216.34"],
    )
    monkeypatch.setattr(
        "app.services.feed_security.PinnedIPTransport",
        lambda ip: httpx.MockTransport(handler),
    )

    response = download_feed("https://example.com/feed.xml")

    assert response.status_code == 200
    assert response.content == feed_content
    assert response.headers["ETag"] == '"abc123"'


def test_download_feed_follows_public_redirect(monkeypatch):
    feed_content = b"<rss></rss>"

    def handler(request):
        if request.url.host == "example.com":
            return httpx.Response(
                302,
                headers={"Location": "https://other.example/feed.xml"},
                request=request,
            )

        return httpx.Response(
            200,
            content=feed_content,
            request=request,
        )

    monkeypatch.setattr(
        "app.services.feed_security.resolve_public_addresses",
        lambda url: ["93.184.216.34"],
    )
    monkeypatch.setattr(
        "app.services.feed_security.PinnedIPTransport",
        lambda ip: httpx.MockTransport(handler),
    )

    response = download_feed("https://example.com/feed.xml")

    assert response.status_code == 200
    assert response.content == feed_content


def test_download_feed_rejects_private_redirect(monkeypatch):
    def resolve(url):
        if "127.0.0.1" in url:
            raise FeedSecurityError("Private IP address rejected.")

        return ["93.184.216.34"]

    def handler(request):
        return httpx.Response(
            302,
            headers={"Location": "http://127.0.0.1/admin"},
            request=request,
        )

    monkeypatch.setattr(
        "app.services.feed_security.resolve_public_addresses",
        resolve,
    )
    monkeypatch.setattr(
        "app.services.feed_security.PinnedIPTransport",
        lambda ip: httpx.MockTransport(handler),
    )

    with pytest.raises(FeedSecurityError, match="Private IP"):
        download_feed("https://example.com/feed.xml")


def test_download_feed_rejects_oversized_response(monkeypatch):
    def handler(request):
        return httpx.Response(
            200,
            content=b"x" * (MAX_FEED_SIZE + 1),
            request=request,
        )

    monkeypatch.setattr(
        "app.services.feed_security.resolve_public_addresses",
        lambda url: ["93.184.216.34"],
    )
    monkeypatch.setattr(
        "app.services.feed_security.PinnedIPTransport",
        lambda ip: httpx.MockTransport(handler),
    )

    with pytest.raises(FeedSecurityError, match="maximum size"):
        download_feed("https://example.com/feed.xml")


def test_download_feed_rejects_too_many_redirects(monkeypatch):
    def handler(request):
        return httpx.Response(
            302,
            headers={"Location": "/feed.xml"},
            request=request,
        )

    monkeypatch.setattr(
        "app.services.feed_security.resolve_public_addresses",
        lambda url: ["93.184.216.34"],
    )
    monkeypatch.setattr(
        "app.services.feed_security.PinnedIPTransport",
        lambda ip: httpx.MockTransport(handler),
    )

    with pytest.raises(FeedSecurityError, match="Too many"):
        download_feed("https://example.com/feed.xml")


def test_download_feed_removes_conditional_headers_on_cross_origin_redirect(
    monkeypatch,
):
    received_headers = {}

    def handler(request):
        if request.url.host == "example.com":
            return httpx.Response(
                302,
                headers={"Location": "https://other.example/feed.xml"},
                request=request,
            )

        received_headers.update(request.headers)

        return httpx.Response(200, content=b"<rss></rss>", request=request)

    monkeypatch.setattr(
        "app.services.feed_security.resolve_public_addresses",
        lambda url: ["93.184.216.34"],
    )
    monkeypatch.setattr(
        "app.services.feed_security.PinnedIPTransport",
        lambda ip: httpx.MockTransport(handler),
    )

    download_feed(
        "https://example.com/feed.xml",
        headers={
            "User-Agent": "RSSReader/1.0",
            "If-None-Match": '"abc123"',
            "If-Modified-Since": "Tue, 03 Nov 2026 10:00:00 GMT",
        },
    )

    assert received_headers["user-agent"] == "RSSReader/1.0"
    assert "if-none-match" not in received_headers
    assert "if-modified-since" not in received_headers