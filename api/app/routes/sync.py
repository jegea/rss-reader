
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger
from app.models.category import Category
from app.models.source import Source
from app.schemas.sync import FeedSyncRequest, FeedSyncResponse
from app.services.feed_sync import sync_feeds

router = APIRouter(
    prefix="/sync",
    tags=["sync"],
)

logger = get_logger(__name__)


@router.post(
    "",
    response_model=FeedSyncResponse,
)
def synchronize_feeds(
    payload: FeedSyncRequest,
    db: Session = Depends(get_db),
) -> FeedSyncResponse:
    if payload.category_id is not None:
        category = db.get(Category, payload.category_id)

        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

    if payload.source_id is not None:
        source = db.get(Source, payload.source_id)

        if source is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source not found",
            )

    logger.info(
        "Feed synchronization started: category_id=%s source_id=%s",
        payload.category_id,
        payload.source_id,
    )

    summary = sync_feeds(
        db=db,
        category_id=payload.category_id,
        source_id=payload.source_id,
    )

    logger.info(
        "Feed synchronization completed: total_sources=%s "
        "successful_sources=%s failed_sources=%s total_entries_found=%s",
        summary.total_sources,
        summary.successful_sources,
        summary.failed_sources,
        summary.total_entries_found,
    )

    return FeedSyncResponse(
        total_sources=summary.total_sources,
        successful_sources=summary.successful_sources,
        failed_sources=summary.failed_sources,
        total_entries_found=summary.total_entries_found,
        results=[
            {
                "source_id": result.source_id,
                "source_name": result.source_name,
                "status": result.status,
                "entries_count": result.entries_count,
                "error": result.error,
            }
            for result in summary.results
        ],
    )
