
from unittest.mock import patch

from uuid6 import uuid7

from app.models.category import Category
from app.models.source import Source
from app.services.feed_sync import FeedSyncSummary, SourceSyncResult


def test_sync_all_sources(client, db_session) -> None:
    summary = FeedSyncSummary(
        total_sources=1,
        successful_sources=1,
        failed_sources=0,
        total_entries_found=5,
        results=[
            SourceSyncResult(
                source_id=uuid7(),
                source_name="Example Feed",
                status="updated",
                entries_count=5,
            ),
        ],
    )

    with patch(
        "app.routes.sync.sync_feeds",
        return_value=summary,
    ) as mock_sync:
        response = client.post("/api/sync", json={})

    assert response.status_code == 200
    assert response.json()["total_sources"] == 1
    assert response.json()["successful_sources"] == 1
    assert response.json()["failed_sources"] == 0
    assert response.json()["total_entries_found"] == 5
    assert response.json()["results"][0]["source_name"] == "Example Feed"

    mock_sync.assert_called_once_with(
        db=db_session,
        category_id=None,
        source_id=None,
    )


def test_sync_by_category(client, db_session) -> None:
    category = Category(name="Technology")
    db_session.add(category)
    db_session.commit()

    summary = FeedSyncSummary(
        total_sources=0,
        successful_sources=0,
        failed_sources=0,
        total_entries_found=0,
        results=[],
    )

    with patch(
        "app.routes.sync.sync_feeds",
        return_value=summary,
    ) as mock_sync:
        response = client.post(
            "/api/sync",
            json={"category_id": str(category.id)},
        )

    assert response.status_code == 200
    assert response.json()["total_sources"] == 0
    assert response.json()["results"] == []

    mock_sync.assert_called_once_with(
        db=db_session,
        category_id=category.id,
        source_id=None,
    )


def test_sync_by_source(client, db_session) -> None:
    source = Source(
        name="Example Feed",
        url="https://example.com/feed.xml",
    )
    db_session.add(source)
    db_session.commit()

    summary = FeedSyncSummary(
        total_sources=0,
        successful_sources=0,
        failed_sources=0,
        total_entries_found=0,
        results=[],
    )

    with patch(
        "app.routes.sync.sync_feeds",
        return_value=summary,
    ) as mock_sync:
        response = client.post(
            "/api/sync",
            json={"source_id": str(source.id)},
        )

    assert response.status_code == 200
    assert response.json()["total_sources"] == 0

    mock_sync.assert_called_once_with(
        db=db_session,
        category_id=None,
        source_id=source.id,
    )


def test_sync_nonexistent_category(client) -> None:
    response = client.post(
        "/api/sync",
        json={"category_id": str(uuid7())},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Category not found"}


def test_sync_nonexistent_source(client) -> None:
    response = client.post(
        "/api/sync",
        json={"source_id": str(uuid7())},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Source not found"}


def test_sync_inactive_source_returns_empty_summary(
    client,
    db_session,
) -> None:
    source = Source(
        name="Inactive Feed",
        url="https://example.com/inactive.xml",
        is_active=False,
    )
    db_session.add(source)
    db_session.commit()

    with patch(
        "app.services.feed_sync.sync_source",
    ) as mock_sync:
        response = client.post(
            "/api/sync",
            json={"source_id": str(source.id)},
        )

    assert response.status_code == 200
    assert response.json() == {
        "total_sources": 0,
        "successful_sources": 0,
        "failed_sources": 0,
        "total_entries_found": 0,
        "results": [],
    }

    mock_sync.assert_not_called()


def test_sync_rejects_category_and_source_filters(client) -> None:
    response = client.post(
        "/api/sync",
        json={
            "category_id": str(uuid7()),
            "source_id": str(uuid7()),
        },
    )

    assert response.status_code == 422
