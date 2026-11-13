
from unittest.mock import patch

import pytest

from app.models.category import Category
from app.models.source import Source
from app.services.feed_ingestion import FeedSyncResult
from app.services.feed_sync import sync_feeds


def create_source(
    db_session,
    name: str,
    url: str,
    category: Category | None = None,
    is_active: bool = True,
) -> Source:
    source = Source(
        name=name,
        url=url,
        category=category,
        is_active=is_active,
    )
    db_session.add(source)
    return source


def test_sync_all_active_sources(db_session) -> None:
    sources = [
        create_source(db_session, "Technology", "https://example.com/technology.xml"),
        create_source(db_session, "Business", "https://example.com/business.xml"),
        create_source(db_session, "Science", "https://example.com/science.xml"),
        create_source(
            db_session,
            "Inactive",
            "https://example.com/inactive.xml",
            is_active=False,
        ),
    ]
    db_session.commit()

    with patch(
        "app.services.feed_sync.sync_source",
        return_value=FeedSyncResult(
            status="updated",
            entries_count=2,
        ),
    ) as mock_sync:
        summary = sync_feeds(db_session)

    synced_ids = [call.args[0].id for call in mock_sync.call_args_list]
    expected_ids = [
        source.id
        for source in sorted(
            [source for source in sources if source.is_active],
            key=lambda source: source.name,
        )
    ]

    assert synced_ids == expected_ids
    assert summary.total_sources == 3
    assert summary.successful_sources == 3
    assert summary.failed_sources == 0
    assert summary.total_entries_found == 6


def test_sync_sources_by_category(db_session) -> None:
    technology = Category(name="Technology")
    business = Category(name="Business")
    db_session.add_all([technology, business])
    db_session.flush()

    technology_sources = [
        create_source(
            db_session,
            "Technology News",
            "https://example.com/technology.xml",
            category=technology,
        ),
        create_source(
            db_session,
            "Science News",
            "https://example.com/science.xml",
            category=technology,
        ),
    ]
    create_source(
        db_session,
        "Business News",
        "https://example.com/business.xml",
        category=business,
    )
    db_session.commit()

    with patch(
        "app.services.feed_sync.sync_source",
        return_value=FeedSyncResult(
            status="updated",
            entries_count=1,
        ),
    ) as mock_sync:
        summary = sync_feeds(db_session, category_id=technology.id)

    synced_ids = [call.args[0].id for call in mock_sync.call_args_list]
    expected_ids = [
        source.id
        for source in sorted(technology_sources, key=lambda source: source.name)
    ]

    assert synced_ids == expected_ids
    assert summary.total_sources == 2
    assert summary.successful_sources == 2
    assert summary.failed_sources == 0


def test_sync_single_source(db_session) -> None:
    source = create_source(
        db_session,
        "Technology News",
        "https://example.com/technology.xml",
    )
    create_source(
        db_session,
        "Business News",
        "https://example.com/business.xml",
    )
    db_session.commit()

    with patch(
        "app.services.feed_sync.sync_source",
        return_value=FeedSyncResult(
            status="updated",
            entries_count=3,
        ),
    ) as mock_sync:
        summary = sync_feeds(db_session, source_id=source.id)

    mock_sync.assert_called_once()
    assert mock_sync.call_args.args[0].id == source.id
    assert summary.total_sources == 1
    assert summary.successful_sources == 1
    assert summary.total_entries_found == 3


def test_sync_excludes_inactive_sources(db_session) -> None:
    active_source = create_source(
        db_session,
        "Active",
        "https://example.com/active.xml",
    )
    create_source(
        db_session,
        "Inactive",
        "https://example.com/inactive.xml",
        is_active=False,
    )
    db_session.commit()

    with patch(
        "app.services.feed_sync.sync_source",
        return_value=FeedSyncResult(
            status="updated",
            entries_count=1,
        ),
    ) as mock_sync:
        summary = sync_feeds(db_session)

    mock_sync.assert_called_once()
    assert mock_sync.call_args.args[0].id == active_source.id
    assert summary.total_sources == 1


def test_sync_category_without_sources(db_session) -> None:
    category = Category(name="Empty category")
    db_session.add(category)
    db_session.commit()

    with patch(
        "app.services.feed_sync.sync_source",
    ) as mock_sync:
        summary = sync_feeds(db_session, category_id=category.id)

    mock_sync.assert_not_called()

    assert summary.total_sources == 0
    assert summary.successful_sources == 0
    assert summary.failed_sources == 0
    assert summary.total_entries_found == 0
    assert summary.results == []


def test_sync_continues_after_operational_error(db_session) -> None:
    create_source(
        db_session,
        "A - Failing source",
        "https://example.com/failing.xml",
    )
    create_source(
        db_session,
        "B - Successful source",
        "https://example.com/successful.xml",
    )
    db_session.commit()

    with (
        patch(
            "app.services.feed_sync.sync_source",
            side_effect=[
                FeedSyncResult(
                    status="error",
                    entries_count=0,
                    error="Connection timeout",
                ),
                FeedSyncResult(
                    status="updated",
                    entries_count=3,
                ),
            ],
        ) as mock_sync,
        patch.object(
            db_session,
            "commit",
            wraps=db_session.commit,
        ) as mock_commit,
    ):
        summary = sync_feeds(db_session)

    assert mock_sync.call_count == 2
    assert mock_commit.call_count == 2

    assert summary.total_sources == 2
    assert summary.successful_sources == 1
    assert summary.failed_sources == 1
    assert summary.total_entries_found == 3

    assert summary.results[0].status == "error"
    assert summary.results[0].error == "Connection timeout"
    assert summary.results[1].status == "updated"


def test_sync_rolls_back_and_propagates_unexpected_exception(
    db_session,
) -> None:
    create_source(
        db_session,
        "Failing source",
        "https://example.com/failing.xml",
    )
    db_session.commit()

    with (
        patch(
            "app.services.feed_sync.sync_source",
            side_effect=RuntimeError("Unexpected error"),
        ) as mock_sync,
        patch.object(
            db_session,
            "rollback",
            wraps=db_session.rollback,
        ) as mock_rollback,
        pytest.raises(RuntimeError, match="Unexpected error"),
    ):
        sync_feeds(db_session)

    mock_sync.assert_called_once()
    mock_rollback.assert_called_once()


def test_sync_rejects_multiple_filters(db_session) -> None:
    category_id = Category(name="Technology")
    db_session.add(category_id)
    db_session.flush()

    source = create_source(
        db_session,
        "Technology News",
        "https://example.com/technology.xml",
        category=category_id,
    )
    db_session.commit()

    with pytest.raises(
        ValueError,
        match="category_id and source_id cannot be used together",
    ):
        sync_feeds(
            db_session,
            category_id=category_id.id,
            source_id=source.id,
        )
