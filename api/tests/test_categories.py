from uuid import UUID

from uuid6 import uuid7

from app.models.article import Article
from app.models.category import Category
from app.models.source import Source


def test_create_category(client) -> None:
    response = client.post(
        "/api/categories",
        json={"name": "Technology"},
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Technology"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_duplicate_category(client) -> None:
    payload = {"name": "Technology"}

    first_response = client.post(
        "/api/categories",
        json=payload,
    )

    second_response = client.post(
        "/api/categories",
        json=payload,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json() == {
        "detail": "Category already exists"
    }


def test_create_category_with_whitespace_only_name(client) -> None:
    response = client.post(
        "/api/categories",
        json={"name": "   "},
    )

    assert response.status_code == 422


def test_create_category_with_name_too_long(client) -> None:
    response = client.post(
        "/api/categories",
        json={"name": "A" * 101},
    )

    assert response.status_code == 422


def test_create_category_trims_whitespace(client) -> None:
    response = client.post(
        "/api/categories",
        json={"name": "  Technology  "},
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Technology"


def test_list_categories(client) -> None:
    client.post("/api/categories", json={"name": "Technology"})
    client.post("/api/categories", json={"name": "Science"})
    client.post("/api/categories", json={"name": "Business"})

    response = client.get("/api/categories")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 3
    assert [category["name"] for category in data] == [
        "Business",
        "Science",
        "Technology",
    ]


def test_list_categories_empty(client) -> None:
    response = client.get("/api/categories")

    assert response.status_code == 200
    assert response.json() == []


def test_get_category(client) -> None:
    create_response = client.post(
        "/api/categories",
        json={"name": "Technology"},
    )

    category_id = create_response.json()["id"]

    response = client.get(f"/api/categories/{category_id}")

    assert response.status_code == 200
    assert response.json()["id"] == category_id
    assert response.json()["name"] == "Technology"


def test_get_nonexistent_category(client) -> None:
    category_id = uuid7()

    response = client.get(f"/api/categories/{category_id}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Category not found"}


def test_update_category(client) -> None:
    create_response = client.post(
        "/api/categories",
        json={"name": "Technology"},
    )

    category_id = create_response.json()["id"]

    response = client.patch(
        f"/api/categories/{category_id}",
        json={"name": "Science"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == category_id
    assert response.json()["name"] == "Science"


def test_update_nonexistent_category(client) -> None:
    category_id = uuid7()

    response = client.patch(
        f"/api/categories/{category_id}",
        json={"name": "Science"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Category not found"}


def test_update_category_with_duplicate_name(client) -> None:
    client.post("/api/categories", json={"name": "Technology"})

    second_response = client.post(
        "/api/categories",
        json={"name": "Science"},
    )

    category_id = second_response.json()["id"]

    response = client.patch(
        f"/api/categories/{category_id}",
        json={"name": "Technology"},
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "Category already exists"}


def test_update_category_without_fields(client) -> None:
    create_response = client.post(
        "/api/categories",
        json={"name": "Technology"},
    )

    category_id = create_response.json()["id"]

    response = client.patch(
        f"/api/categories/{category_id}",
        json={},
    )

    assert response.status_code == 422


def test_update_category_with_null_name(client) -> None:
    create_response = client.post(
        "/api/categories",
        json={"name": "Technology"},
    )

    category_id = create_response.json()["id"]

    response = client.patch(
        f"/api/categories/{category_id}",
        json={"name": None},
    )

    assert response.status_code == 422


def test_update_category_with_same_name(client) -> None:
    create_response = client.post(
        "/api/categories",
        json={"name": "Technology"},
    )

    category_id = create_response.json()["id"]

    response = client.patch(
        f"/api/categories/{category_id}",
        json={"name": "Technology"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Technology"


def test_update_category_trims_whitespace(client) -> None:
    create_response = client.post(
        "/api/categories",
        json={"name": "Technology"},
    )

    category_id = create_response.json()["id"]

    response = client.patch(
        f"/api/categories/{category_id}",
        json={"name": "  Science  "},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Science"


def test_delete_category(client) -> None:
    create_response = client.post(
        "/api/categories",
        json={"name": "Technology"},
    )

    category_id = create_response.json()["id"]

    response = client.delete(f"/api/categories/{category_id}")

    assert response.status_code == 204
    assert response.content == b""

    get_response = client.get(f"/api/categories/{category_id}")

    assert get_response.status_code == 404


def test_delete_nonexistent_category(client) -> None:
    category_id = uuid7()

    response = client.delete(f"/api/categories/{category_id}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Category not found"}


def test_delete_category_with_sources_and_articles(
    client,
    db_session,
) -> None:
    category_response = client.post(
        "/api/categories",
        json={"name": "Technology"},
    )

    category_id = UUID(category_response.json()["id"])

    source_1 = Source(
        name="Tech Source A",
        url="https://example.com/tech-a.xml",
        category_id=category_id,
    )
    source_2 = Source(
        name="Tech Source B",
        url="https://example.com/tech-b.xml",
        category_id=category_id,
    )
    unassigned_source = Source(
        name="Unassigned Source",
        url="https://example.com/unassigned.xml",
    )

    db_session.add_all([
        source_1,
        source_2,
        unassigned_source,
    ])
    db_session.flush()

    article_1 = Article(
        source_id=source_1.id,
        title="First technology article",
        url="https://example.com/article-1",
    )
    article_2 = Article(
        source_id=source_2.id,
        title="Second technology article",
        url="https://example.com/article-2",
    )
    unassigned_article = Article(
        source_id=unassigned_source.id,
        title="Unassigned article",
        url="https://example.com/article-3",
    )

    db_session.add_all([
        article_1,
        article_2,
        unassigned_article,
    ])
    db_session.commit()

    source_ids = [source_1.id, source_2.id]
    article_ids = [article_1.id, article_2.id]
    unassigned_source_id = unassigned_source.id
    unassigned_article_id = unassigned_article.id

    # Ensure the category relationship is not loaded.
    db_session.expire_all()

    response = client.delete(f"/api/categories/{category_id}")

    assert response.status_code == 204

    db_session.expire_all()

    assert db_session.get(Category, category_id) is None

    for source_id in source_ids:
        assert db_session.get(Source, source_id) is None

    for article_id in article_ids:
        assert db_session.get(Article, article_id) is None

    assert db_session.get(Source, unassigned_source_id) is not None
    assert db_session.get(Article, unassigned_article_id) is not None