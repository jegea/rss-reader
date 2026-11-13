from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.source import Source
from app.services.feed_ingestion import sync_source


@dataclass
class SourceSyncResult:
    source_id: UUID
    source_name: str
    status: str
    entries_count: int
    error: str | None = None


@dataclass
class FeedSyncSummary:
    total_sources: int
    successful_sources: int
    failed_sources: int
    total_entries_found: int
    results: list[SourceSyncResult]


def sync_feeds(
    db: Session,
    category_id: UUID | None = None,
    source_id: UUID | None = None,
) -> FeedSyncSummary:
    if category_id is not None and source_id is not None:
        raise ValueError(
            "category_id and source_id cannot be used together"
        )

    statement = select(Source).where(Source.is_active.is_(True))

    if category_id is not None:
        statement = statement.where(Source.category_id == category_id)

    if source_id is not None:
        statement = statement.where(Source.id == source_id)

    sources = db.scalars(statement.order_by(Source.name)).all()

    results = []

    for source in sources:
        current_source_id = source.id
        current_source_name = source.name

        try:
            sync_result = sync_source(source, db)
            db.commit()
        except Exception:
            db.rollback()
            raise

        results.append(
            SourceSyncResult(
                source_id=current_source_id,
                source_name=current_source_name,
                status=sync_result.status,
                entries_count=sync_result.entries_count,
                error=sync_result.error,
            )
        )

    successful_sources = sum(
        result.status != "error"
        for result in results
    )

    failed_sources = sum(
        result.status == "error"
        for result in results
    )

    return FeedSyncSummary(
        total_sources=len(results),
        successful_sources=successful_sources,
        failed_sources=failed_sources,
        total_entries_found=sum(
            result.entries_count for result in results
        ),
        results=results,
    )