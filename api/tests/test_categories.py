from uuid6 import uuid7


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


