from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.models.article import Article
from app.models.category import Category
from app.models.source import Source


@pytest.fixture
def article_dataset(db_session):
    technology = Category(name="Technology")
    news = Category(name="News")

    db_session.add_all([technology, news])
    db_session.flush()

    tech_source_1 = Source(
        name="Tech Source A",
        url="https://example.com/tech-a.xml",
        category_id=technology.id,
    )
    tech_source_2 = Source(
        name="Tech Source B",
        url="https://example.com/tech-b.xml",
        category_id=technology.id,
    )
    news_source = Source(
        name="News Source",
        url="https://example.com/news.xml",
        category_id=news.id,
    )

    db_session.add_all([tech_source_1, tech_source_2, news_source])
    db_session.flush()

    articles = {
        "latest": Article(
            source_id=tech_source_1.id,
            title="Latest technology article",
            url="https://example.com/article-1",
            content="<p>Full article content</p>",
            published_at=datetime(2026, 11, 2, 10, tzinfo=UTC),
            is_read=False,
            is_starred=False,
        ),
        "second": Article(
            source_id=tech_source_2.id,
            title="Second technology article",
            url="https://example.com/article-2",
            published_at=datetime(2026, 11, 1, 10, tzinfo=UTC),
            is_read=True,
            is_starred=True,
        ),
        "third": Article(
            source_id=news_source.id,
            title="News article",
            url="https://example.com/article-3",
            published_at=datetime(2026, 10, 31, 10, tzinfo=UTC),
            is_read=False,
            is_starred=True,
        ),
        "fourth": Article(
            source_id=tech_source_1.id,
            title="Older technology article",
            url="https://example.com/article-4",
            published_at=datetime(2026, 10, 30, 10, tzinfo=UTC),
            is_read=True,
            is_starred=False,
        ),
        "without_date": Article(
            source_id=news_source.id,
            title="Article without publication date",
            url="https://example.com/article-5",
            published_at=None,
            is_read=False,
            is_starred=False,
        ),
    }

    db_session.add_all(articles.values())
    db_session.commit()

    return {
        "technology": technology,
        "news": news,
        "tech_source_1": tech_source_1,
        "tech_source_2": tech_source_2,
        "news_source": news_source,
        "articles": articles,
    }


def test_list_articles(client, article_dataset):
    response = client.get("/api/articles")

    assert response.status_code == 200

    data = response.json()

    assert len(data["items"]) == 5
    assert data["limit"] == 30
    assert data["offset"] == 0
    assert data["has_more"] is False

    expected_order = [
        "latest",
        "second",
        "third",
        "fourth",
        "without_date",
    ]

    actual_ids = [item["id"] for item in data["items"]]
    expected_ids = [
        str(article_dataset["articles"][key].id)
        for key in expected_order
    ]

    assert actual_ids == expected_ids

    for item in data["items"]:
        assert "content" not in item


def test_list_articles_pagination(client, article_dataset):
    first_response = client.get(
        "/api/articles",
        params={"limit": 2, "offset": 0},
    )
    second_response = client.get(
        "/api/articles",
        params={"limit": 2, "offset": 2},
    )
    third_response = client.get(
        "/api/articles",
        params={"limit": 2, "offset": 4},
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert third_response.status_code == 200

    first_page = first_response.json()
    second_page = second_response.json()
    third_page = third_response.json()

    assert len(first_page["items"]) == 2
    assert first_page["has_more"] is True

    assert len(second_page["items"]) == 2
    assert second_page["has_more"] is True

    assert len(third_page["items"]) == 1
    assert third_page["has_more"] is False

    all_ids = (
        [item["id"] for item in first_page["items"]]
        + [item["id"] for item in second_page["items"]]
        + [item["id"] for item in third_page["items"]]
    )

    assert len(all_ids) == len(set(all_ids)) == 5


def test_list_articles_by_source(client, article_dataset):
    source = article_dataset["tech_source_1"]

    response = client.get(
        "/api/articles",
        params={"source_id": str(source.id)},
    )

    assert response.status_code == 200

    items = response.json()["items"]

    assert len(items) == 2
    assert all(item["source_id"] == str(source.id) for item in items)


def test_list_articles_by_category(client, article_dataset):
    category = article_dataset["technology"]

    response = client.get(
        "/api/articles",
        params={"category_id": str(category.id)},
    )

    assert response.status_code == 200

    items = response.json()["items"]

    assert len(items) == 3

    expected_source_ids = {
        str(article_dataset["tech_source_1"].id),
        str(article_dataset["tech_source_2"].id),
    }

    assert all(item["source_id"] in expected_source_ids for item in items)


def test_list_articles_by_read_status(client, article_dataset):
    response = client.get(
        "/api/articles",
        params={"is_read": False},
    )

    assert response.status_code == 200

    items = response.json()["items"]

    assert len(items) == 3
    assert all(item["is_read"] is False for item in items)


def test_list_articles_by_starred_status(client, article_dataset):
    response = client.get(
        "/api/articles",
        params={"is_starred": True},
    )

    assert response.status_code == 200

    items = response.json()["items"]

    assert len(items) == 2
    assert all(item["is_starred"] is True for item in items)


def test_list_articles_with_combined_filters(client, article_dataset):
    category = article_dataset["technology"]

    response = client.get(
        "/api/articles",
        params={
            "category_id": str(category.id),
            "is_read": False,
            "is_starred": False,
        },
    )

    assert response.status_code == 200

    items = response.json()["items"]

    assert len(items) == 1
    assert items[0]["title"] == "Latest technology article"


def test_list_articles_with_nonexistent_source(client):
    response = client.get(
        "/api/articles",
        params={"source_id": str(UUID(
            "00000000-0000-7000-8000-000000000001"
        ))},
    )

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["has_more"] is False


def test_list_articles_with_nonexistent_category(client):
    response = client.get(
        "/api/articles",
        params={"category_id": str(UUID(
            "00000000-0000-7000-8000-000000000001"
        ))},
    )

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["has_more"] is False


@pytest.mark.parametrize(
    "params",
    [
        {"limit": 0},
        {"limit": 101},
        {"offset": -1},
    ],
)
def test_list_articles_with_invalid_pagination(client, params):
    response = client.get("/api/articles", params=params)

    assert response.status_code == 422


def test_get_article(client, article_dataset):
    article = article_dataset["articles"]["latest"]

    response = client.get(f"/api/articles/{article.id}")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == str(article.id)
    assert data["source_id"] == str(article.source_id)
    assert data["title"] == "Latest technology article"
    assert data["content"] == "<p>Full article content</p>"
    assert data["is_read"] is False
    assert data["is_starred"] is False


def test_get_nonexistent_article(client):
    response = client.get(
        "/api/articles/00000000-0000-7000-8000-000000000001"
    )

    assert response.status_code == 404


def test_update_article_read_status(client, article_dataset):
    article = article_dataset["articles"]["latest"]

    response = client.patch(
        f"/api/articles/{article.id}",
        json={"is_read": True},
    )

    assert response.status_code == 200
    assert response.json()["is_read"] is True
    assert response.json()["is_starred"] is False


def test_update_article_starred_status(client, article_dataset):
    article = article_dataset["articles"]["latest"]

    response = client.patch(
        f"/api/articles/{article.id}",
        json={"is_starred": True},
    )

    assert response.status_code == 200
    assert response.json()["is_read"] is False
    assert response.json()["is_starred"] is True


def test_update_article_both_statuses(client, article_dataset):
    article = article_dataset["articles"]["latest"]

    response = client.patch(
        f"/api/articles/{article.id}",
        json={"is_read": True, "is_starred": True},
    )

    assert response.status_code == 200
    assert response.json()["is_read"] is True
    assert response.json()["is_starred"] is True


def test_update_article_empty_payload(client, article_dataset):
    article = article_dataset["articles"]["latest"]

    response = client.patch(
        f"/api/articles/{article.id}",
        json={},
    )

    assert response.status_code == 422


def test_update_article_null_value(client, article_dataset):
    article = article_dataset["articles"]["latest"]

    response = client.patch(
        f"/api/articles/{article.id}",
        json={"is_read": None},
    )

    assert response.status_code == 422


def test_update_nonexistent_article(client):
    response = client.patch(
        "/api/articles/00000000-0000-7000-8000-000000000001",
        json={"is_read": True},
    )

    assert response.status_code == 404