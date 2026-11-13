import pytest
from uuid6 import uuid7

from app.models.article import Article
from app.models.category import Category
from app.models.source import Source
from app.services.feed_ingestion import FeedFetchResult


def make_feed_fetch_result(title: str) -> FeedFetchResult:
    content = f"""
    <rss version="2.0">
        <channel>
            <title>{title}</title>
            <item>
                <title>First Article</title>
                <link>https://example.com/articles/1</link>
                <guid>article-1</guid>
            </item>
        </channel>
    </rss>
    """.encode()

    return FeedFetchResult(
        content=content,
        etag='"test-etag"',
        last_modified=None,
        not_modified=False,
    )


@pytest.fixture(autouse=True)
def mock_fetch_feed(monkeypatch):
    titles = {
        "feed.xml": "Example Feed",
        "technology.xml": "Technology News",
        "business.xml": "Business News",
        "science.xml": "Science News",
    }

    def fake_fetch_feed(url, etag=None, last_modified=None):
        filename = url.rsplit("/", 1)[-1]
        title = titles.get(filename, "Example Feed")

        return make_feed_fetch_result(title)

    monkeypatch.setattr(
        "app.routes.sources.fetch_feed",
        fake_fetch_feed,
    )


def test_create_source(client) -> None:
    response = client.post(
        "/api/sources",
        json={"url": "https://example.com/feed.xml"},
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Example Feed"
    assert data["url"] == "https://example.com/feed.xml"
    assert data["category_id"] is None
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_source_with_category(client) -> None:
    category_response = client.post(
        "/api/categories",
        json={"name": "Technology"},
    )

    category_id = category_response.json()["id"]

    response = client.post(
        "/api/sources",
        json={
            "url": "https://example.com/technology.xml",
            "category_id": category_id,
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Technology News"
    assert response.json()["category_id"] == category_id


def test_create_source_with_nonexistent_category(client) -> None:
    response = client.post(
        "/api/sources",
        json={
            "name": "Example Feed",
            "url": "https://example.com/feed.xml",
            "category_id": str(uuid7()),
        },
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Category not found"}


def test_create_duplicate_source_url(client) -> None:
    payload = {
        "url": "https://example.com/feed.xml",
    }

    first_response = client.post(
        "/api/sources",
        json=payload,
    )

    second_response = client.post(
        "/api/sources",
        json=payload,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json() == {
        "detail": "Source URL already exists"
    }


def test_create_source_without_feed_title(client, monkeypatch):
    def mock_fetch_feed(url, etag=None, last_modified=None):
        return FeedFetchResult(
            content=b"<rss><channel></channel></rss>",
            etag=None,
            last_modified=None,
            not_modified=False,
        )

    monkeypatch.setattr(
        "app.routes.sources.fetch_feed",
        mock_fetch_feed,
    )

    response = client.post(
        "/api/sources",
        json={"url": "https://example.com/feed.xml"},
    )

    assert response.status_code == 422
    assert response.json() == {
        "detail": "The feed does not provide a title"
    }


def test_create_source_with_invalid_url(client) -> None:
    response = client.post(
        "/api/sources",
        json={
            "name": "Example Feed",
            "url": "not-a-valid-url",
        },
    )

    assert response.status_code == 422



def test_list_sources(client) -> None:
    client.post(
        "/api/sources",
        json={
            "url": "https://example.com/technology.xml",
        },
    )
    client.post(
        "/api/sources",
        json={
            "url": "https://example.com/business.xml",
        },
    )
    client.post(
        "/api/sources",
        json={
            "url": "https://example.com/science.xml",
        },
    )

    response = client.get("/api/sources")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 3
    assert [source["name"] for source in data] == [
        "Business News",
        "Science News",
        "Technology News",
    ]


def test_list_sources_by_category(client) -> None:
    category_response = client.post(
        "/api/categories",
        json={"name": "Technology"},
    )

    category_id = category_response.json()["id"]

    client.post(
        "/api/sources",
        json={
            "url": "https://example.com/technology.xml",
            "category_id": category_id,
        },
    )
    client.post(
        "/api/sources",
        json={
            "url": "https://example.com/business.xml",
        },
    )

    response = client.get(
        "/api/sources",
        params={"category_id": category_id},
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Technology News"
    assert data[0]["category_id"] == category_id


def test_list_sources_empty(client) -> None:
    response = client.get("/api/sources")

    assert response.status_code == 200
    assert response.json() == []


def test_get_source(client) -> None:
    create_response = client.post(
        "/api/sources",
        json={
            "url": "https://example.com/technology.xml",
        },
    )

    source_id = create_response.json()["id"]

    response = client.get(f"/api/sources/{source_id}")

    assert response.status_code == 200
    assert response.json()["id"] == source_id
    assert response.json()["name"] == "Technology News"


def test_get_nonexistent_source(client) -> None:
    source_id = uuid7()

    response = client.get(f"/api/sources/{source_id}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Source not found"}


def test_update_source_name(client, db_session):
    source = Source(
        name="Original source",
        url="https://example.com/feed.xml",
    )
    db_session.add(source)
    db_session.commit()

    response = client.patch(
        f"/api/sources/{source.id}",
        json={"name": "Updated source"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated source"


def test_update_source_assign_category(client, db_session):
    category = Category(name="Technology")
    source = Source(
        name="Example source",
        url="https://example.com/feed.xml",
    )
    db_session.add_all([category, source])
    db_session.commit()

    response = client.patch(
        f"/api/sources/{source.id}",
        json={"category_id": str(category.id)},
    )

    assert response.status_code == 200
    assert response.json()["category_id"] == str(category.id)


def test_update_source_change_category(client, db_session):
    first_category = Category(name="Technology")
    second_category = Category(name="News")
    source = Source(
        name="Example source",
        url="https://example.com/feed.xml",
        category=first_category,
    )
    db_session.add_all([first_category, second_category, source])
    db_session.commit()

    response = client.patch(
        f"/api/sources/{source.id}",
        json={"category_id": str(second_category.id)},
    )

    assert response.status_code == 200
    assert response.json()["category_id"] == str(second_category.id)


def test_update_source_remove_category(client, db_session):
    category = Category(name="Technology")
    source = Source(
        name="Example source",
        url="https://example.com/feed.xml",
        category=category,
    )
    db_session.add_all([category, source])
    db_session.commit()

    response = client.patch(
        f"/api/sources/{source.id}",
        json={"category_id": None},
    )

    assert response.status_code == 200
    assert response.json()["category_id"] is None


def test_update_source_preserve_category_when_omitted(client, db_session):
    category = Category(name="Technology")
    source = Source(
        name="Original source",
        url="https://example.com/feed.xml",
        category=category,
    )
    db_session.add_all([category, source])
    db_session.commit()

    response = client.patch(
        f"/api/sources/{source.id}",
        json={"name": "Updated source"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated source"
    assert response.json()["category_id"] == str(category.id)


def test_update_nonexistent_source(client):
    response = client.patch(
        f"/api/sources/{uuid7()}",
        json={"name": "Updated source"},
    )

    assert response.status_code == 404


def test_update_source_with_nonexistent_category(client, db_session):
    source = Source(
        name="Example source",
        url="https://example.com/feed.xml",
    )
    db_session.add(source)
    db_session.commit()

    response = client.patch(
        f"/api/sources/{source.id}",
        json={"category_id": str(uuid7())},
    )

    assert response.status_code == 404


def test_update_source_with_empty_payload(client, db_session):
    source = Source(
        name="Example source",
        url="https://example.com/feed.xml",
    )
    db_session.add(source)
    db_session.commit()

    response = client.patch(
        f"/api/sources/{source.id}",
        json={},
    )

    assert response.status_code == 422


def test_update_source_with_null_name(client, db_session):
    source = Source(
        name="Example source",
        url="https://example.com/feed.xml",
    )
    db_session.add(source)
    db_session.commit()

    response = client.patch(
        f"/api/sources/{source.id}",
        json={"name": None},
    )

    assert response.status_code == 422


def test_update_source_with_blank_name(client, db_session):
    source = Source(
        name="Example source",
        url="https://example.com/feed.xml",
    )
    db_session.add(source)
    db_session.commit()

    response = client.patch(
        f"/api/sources/{source.id}",
        json={"name": "   "},
    )

    assert response.status_code == 422


def test_delete_source(client, db_session):
    source = Source(
        name="Example source",
        url="https://example.com/feed.xml",
    )
    db_session.add(source)
    db_session.commit()

    response = client.delete(f"/api/sources/{source.id}")

    assert response.status_code == 204
    assert db_session.get(Source, source.id) is None


def test_delete_source_with_articles(client, db_session):
    source = Source(
        name="Example source",
        url="https://example.com/feed.xml",
    )
    article = Article(
        source=source,
        title="Example article",
        url="https://example.com/article",
    )
    db_session.add_all([source, article])
    db_session.commit()

    article_id = article.id
    source_id = source.id

    response = client.delete(f"/api/sources/{source_id}")

    assert response.status_code == 204

    db_session.expire_all()
    
    assert db_session.get(Source, source_id) is None
    assert db_session.get(Article, article_id) is None


def test_delete_nonexistent_source(client):
    response = client.delete(f"/api/sources/{uuid7()}")

    assert response.status_code == 404