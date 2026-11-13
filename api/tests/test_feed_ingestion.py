from datetime import UTC, datetime
from time import struct_time

import httpx
import pytest
from sqlalchemy import select

from app.models.article import Article
from app.models.source import Source
from app.services.feed_ingestion import (
    FeedFetchResult,
    fetch_feed,
    normalize_entry,
    normalize_url,
    parse_feed,
    save_articles,
    sync_source,
)


def test_fetch_feed_returns_content(monkeypatch):
    feed_content = b"<rss><channel><title>Test Feed</title></channel></rss>"

    def mock_download_feed(url, headers=None):
        return httpx.Response(
            status_code=200,
            content=feed_content,
            headers={
                "ETag": '"abc123"',
                "Last-Modified": "Tue, 03 Nov 2026 10:00:00 GMT",
            },
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(
        "app.services.feed_ingestion.download_feed",
        mock_download_feed,
    )

    result = fetch_feed("https://example.com/feed.xml")

    assert result.content == feed_content
    assert result.etag == '"abc123"'
    assert result.last_modified == "Tue, 03 Nov 2026 10:00:00 GMT"
    assert result.not_modified is False


def test_fetch_feed_raises_for_http_error(monkeypatch):
    def mock_get(url, **kwargs):
        return httpx.Response(
            status_code=500,
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(
        "app.services.feed_ingestion.download_feed",
        mock_get,
    )

    with pytest.raises(httpx.HTTPStatusError):
        fetch_feed("https://example.com/feed.xml")


def test_parse_rss_feed():
    content = b"""
    <?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
        <channel>
            <title>Test RSS Feed</title>
            <link>https://example.com</link>
            <description>Test feed description</description>
            <item>
                <title>First Article</title>
                <link>https://example.com/articles/1</link>
                <guid>article-1</guid>
                <description>Article summary</description>
        </item>
        </channel>
    </rss>
    """

    parsed_feed = parse_feed(content)

    assert parsed_feed.feed.title == "Test RSS Feed"
    assert len(parsed_feed.entries) == 1
    assert parsed_feed.entries[0].title == "First Article"
    assert parsed_feed.entries[0].link == "https://example.com/articles/1"
    assert parsed_feed.entries[0].id == "article-1"


def test_parse_atom_feed():
    content = b"""
    <?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Test Atom Feed</title>
        <entry>
            <title>First Atom Article</title>
            <id>https://example.com/articles/1</id>
            <link href="https://example.com/articles/1"/>
            <summary>Article summary</summary>
        </entry>
    </feed>
    """

    parsed_feed = parse_feed(content)

    assert parsed_feed.feed.title == "Test Atom Feed"
    assert len(parsed_feed.entries) == 1
    assert parsed_feed.entries[0].title == "First Atom Article"
    assert parsed_feed.entries[0].link == "https://example.com/articles/1"


def test_normalize_entry():
    entry = {
        "id": "article-1",
        "title": "  First Article  ",
        "link": "https://example.com/articles/1",
        "author": "  John Doe  ",
        "published_parsed": struct_time(
            (2026, 11, 3, 15, 8, 58, 1, 307, 0)
        ),
        "content": [
            {
                "type": "text/html",
                "value": "<p>Full article content</p>",
            }
        ],
        "summary": "Article summary",
    }

    result = normalize_entry(entry)

    assert result is not None
    assert result["external_id"] == "article-1"
    assert result["title"] == "First Article"
    assert result["url"] == "https://example.com/articles/1"
    assert result["author"] == "John Doe"
    assert result["content"] == "<p>Full article content</p>"
    assert result["published_at"] == datetime(
        2026,
        11,
        3,
        15,
        8,
        58,
        tzinfo=UTC,
    )
    assert result["normalized_url"] == "https://example.com/articles/1"


def test_normalize_entry_uses_summary_when_content_is_missing():
    entry = {
        "title": "Article with summary",
        "summary": "<p>Article summary</p>",
    }

    result = normalize_entry(entry)

    assert result is not None
    assert result["content"] == "<p>Article summary</p>"
    assert result["external_id"] is None
    assert result["url"] is None
    assert result["author"] is None
    assert result["published_at"] is None


def test_normalize_entry_returns_none_without_title():
    entry = {
        "title": " ",
        "summary": "Article summary",
    }

    result = normalize_entry(entry)

    assert result is None


def test_normalize_url_lowercases_scheme_and_hostname():
    result = normalize_url("HTTPS://EXAMPLE.COM/Article/123")

    assert result == "https://example.com/Article/123"


def test_normalize_url_removes_default_port():
    result = normalize_url("http://example.com:80/article")

    assert result == "http://example.com/article"


def test_normalize_url_preserves_non_default_port():
    result = normalize_url("https://example.com:8443/article")

    assert result == "https://example.com:8443/article"


def test_normalize_url_removes_fragment():
    result = normalize_url("https://example.com/article#comments")

    assert result == "https://example.com/article"


def test_normalize_url_preserves_query_parameters():
    result = normalize_url(
        "https://example.com/article?id=123&utm_source=rss"
    )

    assert result == "https://example.com/article?id=123&utm_source=rss"


def test_normalize_url_returns_none_for_invalid_urls():
    assert normalize_url(None) is None
    assert normalize_url("") is None
    assert normalize_url("/articles/123") is None
    assert normalize_url("ftp://example.com/article") is None
    assert normalize_url("https://example.com:invalid/article") is None


def test_normalize_entry_preserves_original_url_and_normalizes_it():
    entry = {
        "title": "Test article",
        "link": "HTTPS://EXAMPLE.COM/article?id=123#comments",
    }

    result = normalize_entry(entry)

    assert result["url"] == "HTTPS://EXAMPLE.COM/article?id=123#comments"
    assert result["normalized_url"] == "https://example.com/article?id=123"


def test_fetch_feed_sends_conditional_headers(monkeypatch):
    received_headers = {}

    def mock_get(url, **kwargs):
        received_headers.update(kwargs["headers"])

        return httpx.Response(
            status_code=200,
            content=b"<rss></rss>",
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(
        "app.services.feed_ingestion.download_feed",
        mock_get,
    )

    fetch_feed(
        "https://example.com/feed.xml",
        etag='"abc123"',
        last_modified="Tue, 03 Nov 2026 10:00:00 GMT",
    )

    assert received_headers["If-None-Match"] == '"abc123"'
    assert received_headers["If-Modified-Since"] == (
        "Tue, 03 Nov 2026 10:00:00 GMT"
    )


def test_fetch_feed_returns_not_modified(monkeypatch):
    def mock_get(url, **kwargs):
        return httpx.Response(
            status_code=304,
            headers={
                "ETag": '"abc123"',
                "Last-Modified": "Tue, 03 Nov 2026 10:00:00 GMT",
            },
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(
        "app.services.feed_ingestion.download_feed",
        mock_get,
    )

    result = fetch_feed(
        "https://example.com/feed.xml",
        etag='"abc123"',
        last_modified="Tue, 03 Nov 2026 10:00:00 GMT",
    )

    assert result.content is None
    assert result.etag == '"abc123"'
    assert result.last_modified == "Tue, 03 Nov 2026 10:00:00 GMT"
    assert result.not_modified is True


def test_fetch_feed_returns_not_modified_without_validators(monkeypatch):
    def mock_get(url, **kwargs):
        return httpx.Response(
            status_code=304,
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(
        "app.services.feed_ingestion.download_feed",
        mock_get,
    )

    result = fetch_feed("https://example.com/feed.xml")

    assert result.content is None
    assert result.etag is None
    assert result.last_modified is None
    assert result.not_modified is True


def test_sync_source_updates_metadata(db_session, monkeypatch):
    source = Source(
        name="Test Feed",
        url="https://example.com/feed.xml",
    )
    db_session.add(source)
    db_session.flush()

    feed_content = b"""
    <rss version="2.0">
        <channel>
            <title>Test Feed</title>
            <item>
                <title>First Article</title>
                <link>https://example.com/articles/1</link>
                <guid>article-1</guid>
            </item>
        </channel>
    </rss>
    """

    def mock_fetch_feed(url, etag=None, last_modified=None):
        return FeedFetchResult(
            content=feed_content,
            etag='"new-etag"',
            last_modified="Tue, 03 Nov 2026 10:00:00 GMT",
            not_modified=False,
        )

    monkeypatch.setattr(
        "app.services.feed_ingestion.fetch_feed",
        mock_fetch_feed,
    )

    result = sync_source(source, db_session)

    assert result.status == "updated"
    assert result.entries_count == 1
    assert result.error is None

    assert source.etag == '"new-etag"'
    assert source.last_modified == "Tue, 03 Nov 2026 10:00:00 GMT"
    assert source.last_checked_at is not None
    assert source.last_successful_sync_at is not None
    assert source.last_error is None


def create_test_source(db_session):
    source = Source(
        name="Test Feed",
        url="https://example.com/feed.xml",
    )
    db_session.add(source)
    db_session.flush()
    return source


def make_test_entry(
    external_id="article-1",
    url="https://example.com/articles/1",
    normalized_url="https://example.com/articles/1",
    title="Test Article",
    content="Test content",
):
    return {
        "external_id": external_id,
        "title": title,
        "url": url,
        "normalized_url": normalized_url,
        "content": content,
        "author": None,
        "published_at": None,
        "updated_at": None,
    }


def test_save_articles_inserts_new_articles(db_session):
    source = create_test_source(db_session)
    entry = make_test_entry()

    inserted_count = save_articles(source, [entry], db_session)

    articles = db_session.scalars(select(Article)).all()

    assert inserted_count == 1
    assert len(articles) == 1
    assert articles[0].source_id == source.id
    assert articles[0].external_id == "article-1"
    assert articles[0].title == "Test Article"
    assert articles[0].is_read is False
    assert articles[0].is_starred is False


def test_save_articles_ignores_duplicate_external_id(db_session):
    source = create_test_source(db_session)

    first_entry = make_test_entry()
    second_entry = make_test_entry(
        url="https://example.com/articles/2",
        normalized_url="https://example.com/articles/2",
        title="Another Article",
    )

    save_articles(source, [first_entry], db_session)
    inserted_count = save_articles(source, [second_entry], db_session)

    articles = db_session.scalars(select(Article)).all()

    assert inserted_count == 0
    assert len(articles) == 1
    assert articles[0].title == "Test Article"


def test_save_articles_ignores_duplicate_normalized_url(db_session):
    source = create_test_source(db_session)

    first_entry = make_test_entry()
    second_entry = make_test_entry(
        external_id="article-2",
        title="Another Article",
    )

    save_articles(source, [first_entry], db_session)
    inserted_count = save_articles(source, [second_entry], db_session)

    articles = db_session.scalars(select(Article)).all()

    assert inserted_count == 0
    assert len(articles) == 1
    assert articles[0].external_id == "article-1"


def test_save_articles_preserves_existing_article(db_session):
    source = create_test_source(db_session)

    original_entry = make_test_entry()
    save_articles(source, [original_entry], db_session)

    existing_article = db_session.scalar(select(Article))
    existing_article.is_read = True
    existing_article.is_starred = True
    db_session.flush()

    updated_entry = make_test_entry(
        title="Updated Article",
        content="Updated content",
    )

    inserted_count = save_articles(source, [updated_entry], db_session)

    db_session.refresh(existing_article)

    assert inserted_count == 0
    assert existing_article.title == "Test Article"
    assert existing_article.content == "Test content"
    assert existing_article.is_read is True
    assert existing_article.is_starred is True


def test_sync_source_saves_articles(db_session, monkeypatch):
    source = create_test_source(db_session)

    feed_content = b"""
    <rss version="2.0">
        <channel>
            <title>Test Feed</title>
            <item>
                <title>First Article</title>
                <link>https://example.com/articles/1</link>
                <guid>article-1</guid>
            </item>
            <item>
                <title>Second Article</title>
                <link>https://example.com/articles/2</link>
                <guid>article-2</guid>
            </item>
        </channel>
    </rss>
    """

    def mock_fetch_feed(url, etag=None, last_modified=None):
        return FeedFetchResult(
            content=feed_content,
            etag='"test-etag"',
            last_modified=None,
            not_modified=False,
        )

    monkeypatch.setattr(
        "app.services.feed_ingestion.fetch_feed",
        mock_fetch_feed,
    )

    result = sync_source(source, db_session)

    articles = db_session.scalars(
        select(Article).where(Article.source_id == source.id)
    ).all()

    assert result.status == "updated"
    assert result.entries_count == 2
    assert len(articles) == 2
    assert source.etag == '"test-etag"'
    assert source.last_successful_sync_at is not None


def test_sync_source_does_not_duplicate_articles(db_session, monkeypatch):
    source = create_test_source(db_session)

    feed_content = b"""
    <rss version="2.0">
        <channel>
            <title>Test Feed</title>
            <item>
                <title>First Article</title>
                <link>https://example.com/articles/1</link>
                <guid>article-1</guid>
            </item>
        </channel>
    </rss>
    """

    def mock_fetch_feed(url, etag=None, last_modified=None):
        return FeedFetchResult(
            content=feed_content,
            etag='"test-etag"',
            last_modified=None,
            not_modified=False,
        )

    monkeypatch.setattr(
        "app.services.feed_ingestion.fetch_feed",
        mock_fetch_feed,
    )

    first_result = sync_source(source, db_session)
    second_result = sync_source(source, db_session)

    articles = db_session.scalars(
        select(Article).where(Article.source_id == source.id)
    ).all()

    assert first_result.entries_count == 1
    assert second_result.entries_count == 1
    assert len(articles) == 1


def test_sync_source_does_not_mark_success_on_persistence_error(
    db_session,
    monkeypatch,
):
    source = create_test_source(db_session)

    feed_content = b"""
    <rss version="2.0">
        <channel>
            <title>Test Feed</title>
            <item>
                <title>First Article</title>
                <link>https://example.com/articles/1</link>
                <guid>article-1</guid>
            </item>
        </channel>
    </rss>
    """

    def mock_fetch_feed(url, etag=None, last_modified=None):
        return FeedFetchResult(
            content=feed_content,
            etag='"test-etag"',
            last_modified=None,
            not_modified=False,
        )

    def mock_save_articles(source, entries, db):
        raise RuntimeError("Database error")

    monkeypatch.setattr(
        "app.services.feed_ingestion.fetch_feed",
        mock_fetch_feed,
    )
    monkeypatch.setattr(
        "app.services.feed_ingestion.save_articles",
        mock_save_articles,
    )

    with pytest.raises(RuntimeError, match="Database error"):
        sync_source(source, db_session)

    assert source.last_successful_sync_at is None


@pytest.mark.parametrize(
    "exception",
    [
        httpx.HTTPStatusError(
            "Internal Server Error",
            request=httpx.Request(
                "GET",
                "https://example.com/feed.xml",
            ),
            response=httpx.Response(
                500,
                request=httpx.Request(
                    "GET",
                    "https://example.com/feed.xml",
                ),
            ),
        ),
        httpx.TimeoutException("Request timed out"),
        httpx.ConnectError("Connection failed"),
    ],
)
def test_sync_source_updates_last_checked_at_on_http_error(
    db_session,
    monkeypatch,
    exception,
):
    source = create_test_source(db_session)

    def mock_fetch_feed(url, etag=None, last_modified=None):
        raise exception

    monkeypatch.setattr(
        "app.services.feed_ingestion.fetch_feed",
        mock_fetch_feed,
    )

    result = sync_source(source, db_session)

    assert result.status == "error"
    assert result.entries_count == 0
    assert result.error == str(exception)

    assert source.last_checked_at is not None
    assert source.last_error == str(exception)

    assert source.last_successful_sync_at is None


def test_sync_source_does_not_mark_success_on_parse_error(
    db_session,
    monkeypatch,
):
    source = create_test_source(db_session)

    feed_content = b"""
    <rss>
        <channel>
            <title>Malformed Feed</title>
            <item>
                <title>Incomplete Article
    """

    def mock_fetch_feed(url, etag=None, last_modified=None):
        return FeedFetchResult(
            content=feed_content,
            etag=None,
            last_modified=None,
            not_modified=False,
        )

    monkeypatch.setattr(
        "app.services.feed_ingestion.fetch_feed",
        mock_fetch_feed,
    )

    result = sync_source(source, db_session)

    articles = db_session.scalars(
        select(Article).where(Article.source_id == source.id)
    ).all()

    assert result.status == "error"
    assert result.entries_count == 0
    assert result.error is not None

    assert source.last_checked_at is not None
    assert source.last_error is not None
    assert source.last_successful_sync_at is None

    assert len(articles) == 0