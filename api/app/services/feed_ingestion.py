import calendar
from dataclasses import dataclass
from datetime import UTC, datetime
from time import struct_time
from urllib.parse import urlsplit, urlunsplit

import feedparser
import httpx
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.article import Article
from app.models.source import Source
from app.services.feed_security import download_feed

logger = get_logger(__name__)

@dataclass
class FeedFetchResult:
    content: bytes | None
    etag: str | None
    last_modified: str | None
    not_modified: bool


@dataclass
class FeedSyncResult:
    status: str
    entries_count: int
    error: str | None = None


def fetch_feed(
    url: str,
    etag: str | None = None,
    last_modified: str | None = None,
) -> FeedFetchResult:
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.1",
        "Accept-Encoding": "identity",
    }

    if etag:
        headers["If-None-Match"] = etag

    if last_modified:
        headers["If-Modified-Since"] = last_modified

    response = download_feed(url, headers=headers)

    if response.status_code == 304:
        return FeedFetchResult(
            content=None,
            etag=response.headers.get("ETag"),
            last_modified=response.headers.get("Last-Modified"),
            not_modified=True,
        )

    if response.is_error:
        logger.warning(
            "Feed server returned an error: "
            "status=%s url=%s content_type=%s server=%s location=%s body=%r",
            response.status_code,
            response.request.url,
            response.headers.get("content-type"),
            response.headers.get("server"),
            response.headers.get("location"),
            response.text[:500],
        )

    response.raise_for_status()

    return FeedFetchResult(
        content=response.content,
        etag=response.headers.get("ETag"),
        last_modified=response.headers.get("Last-Modified"),
        not_modified=False,
    )


def parse_feed(content: bytes) -> feedparser.FeedParserDict:
    return feedparser.parse(content)


def normalize_entry(
    entry: feedparser.FeedParserDict,
) -> dict | None:
    title = entry.get("title", "").strip()

    if not title:
        return None

    external_id = entry.get("id")
    url = entry.get("link")

    content = None
    content_entries = entry.get("content", [])

    if content_entries:
        content = content_entries[0].get("value")

    if not content:
        content = entry.get("summary")

    author = entry.get("author")

    if author:
        author = author.strip() or None

    published_at = parse_entry_date(entry.get("published_parsed"))
    updated_at = parse_entry_date(entry.get("updated_parsed"))

    return {
        "external_id": external_id,
        "title": title,
        "url": url,
        "normalized_url": normalize_url(url),
        "content": content,
        "author": author,
        "published_at": published_at,
        "updated_at": updated_at,
    }


def parse_entry_date(value: struct_time | None) -> datetime | None:
    if not isinstance(value, struct_time):
        return None

    timestamp = calendar.timegm(value)

    return datetime.fromtimestamp(
        timestamp,
        tz=UTC,
    )


def normalize_url(url: str | None) -> str | None:
    if not url:
        return None

    try:
        parts = urlsplit(url.strip())

        scheme = parts.scheme.lower()
        hostname = parts.hostname

        if scheme not in {"http", "https"} or not hostname:
            return None

        port = parts.port

    except ValueError:
        return None

    netloc = hostname

    if ":" in hostname:
        netloc = f"[{hostname}]"

    if port is not None and not (
        (scheme == "http" and port == 80)
        or (scheme == "https" and port == 443)
    ):
        netloc = f"{netloc}:{port}"

    return urlunsplit(
        (
            scheme,
            netloc,
            parts.path,
            parts.query,
            "",
        )
    )


def sync_source(source: Source, db: Session) -> FeedSyncResult:
    now = datetime.now(UTC)
    source.last_checked_at = now

    try:
        fetch_result = fetch_feed(
            url=source.url,
            etag=source.etag,
            last_modified=source.last_modified,
        )
    except httpx.HTTPError as exc:
        source.last_error = str(exc)

        return FeedSyncResult(
            status="error",
            entries_count=0,
            error=str(exc),
        )

    if fetch_result.not_modified:
        if fetch_result.etag is not None:
            source.etag = fetch_result.etag

        if fetch_result.last_modified is not None:
            source.last_modified = fetch_result.last_modified

        source.last_successful_sync_at = now
        source.last_error = None

        return FeedSyncResult(
            status="not_modified",
            entries_count=0,
        )

    parsed_feed = parse_feed(fetch_result.content)

    if parsed_feed.bozo:
        error = str(parsed_feed.bozo_exception)
        source.last_error = error

        return FeedSyncResult(
            status="error",
            entries_count=0,
            error=error,
        )

    entries = []

    for entry in parsed_feed.entries:
        normalized_entry = normalize_entry(entry)

        if normalized_entry is not None:
            entries.append(normalized_entry)

    save_articles(source, entries, db)

    source.etag = fetch_result.etag
    source.last_modified = fetch_result.last_modified

    source.last_successful_sync_at = now
    source.last_error = None

    return FeedSyncResult(
        status="updated",
        entries_count=len(entries),
    )


def save_articles(
    source: Source,
    entries: list[dict],
    db: Session,
) -> int:
    if not entries:
        return 0

    articles = [
        {
            "source_id": source.id,
            "external_id": entry["external_id"],
            "title": entry["title"],
            "url": entry["url"],
            "normalized_url": entry["normalized_url"],
            "content": entry["content"],
            "author": entry["author"],
            "published_at": entry["published_at"],
            "updated_at": entry["updated_at"],
        }
        for entry in entries
    ]

    statement = (
        insert(Article)
        .values(articles)
        .on_conflict_do_nothing()
        .returning(Article.id)
    )

    result = db.execute(statement)

    return len(result.scalars().all())