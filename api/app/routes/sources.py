from datetime import UTC, datetime
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger
from app.models.category import Category
from app.models.source import Source
from app.schemas.source import SourceCreate, SourceResponse, SourceUpdate
from app.services.feed_ingestion import (
    fetch_feed,
    normalize_entry,
    parse_feed,
    save_articles,
)
from app.services.feed_security import FeedSecurityError

router = APIRouter(
    prefix="/sources",
    tags=["sources"],
)

logger = get_logger(__name__)


@router.post(
    "",
    response_model=SourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_source(
    payload: SourceCreate,
    db: Session = Depends(get_db),
) -> Source:
    if payload.category_id is not None:
        category = db.get(Category, payload.category_id)

        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

    source_url = str(payload.url)

    existing_source = db.scalar(
        select(Source).where(Source.url == source_url)
    )

    if existing_source:
        logger.warning(
            "Source creation rejected: url='%s' already exists",
            source_url,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Source URL already exists",
        )

    try:
        fetch_result = fetch_feed(source_url)

        if fetch_result.not_modified or fetch_result.content is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Could not retrieve feed content",
            )

        parsed_feed = parse_feed(fetch_result.content)

        if parsed_feed.bozo:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="The URL does not contain a valid RSS or Atom feed",
            )

        feed_title = parsed_feed.feed.get("title", "").strip()

        if not feed_title:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="The feed does not provide a title",
            )

        if len(feed_title) > 200:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="The feed title exceeds the maximum length of 200 characters",
            )

    except FeedSecurityError as exc:
        logger.warning(
            "Source creation rejected due to feed security validation: url='%s' error='%s'",
            source_url,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    except httpx.HTTPError as exc:
        logger.warning(
            "Source creation failed while downloading feed: url='%s' error='%s'",
            source_url,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Could not download the feed",
        ) from exc

    source = Source(
        name=feed_title,
        url=source_url,
        category_id=payload.category_id,
    )

    try:
        db.add(source)
        db.flush()

        entries = []

        for entry in parsed_feed.entries:
            normalized_entry = normalize_entry(entry)

            if normalized_entry is not None:
                entries.append(normalized_entry)

        save_articles(source, entries, db)

        now = datetime.now(UTC)

        source.etag = fetch_result.etag
        source.last_modified = fetch_result.last_modified
        source.last_checked_at = now
        source.last_successful_sync_at = now
        source.last_error = None

        db.commit()
        db.refresh(source)

        logger.info(
            "Source created: id=%s name='%s'",
            source.id,
            source.name,
        )

    except IntegrityError as exc:
        db.rollback()

        logger.warning(
            "Source creation failed due to an integrity constraint: url='%s'",
            source_url,
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Source could not be created due to a conflict",
        ) from exc

    except Exception:
        db.rollback()
        raise

    return source


@router.get(
    "",
    response_model=list[SourceResponse],
)
def list_sources(
    category_id: UUID | None = None,
    db: Session = Depends(get_db),
) -> list[Source]:
    statement = select(Source)

    if category_id is not None:
        statement = statement.where(
            Source.category_id == category_id
        )

    statement = statement.order_by(Source.name)

    return list(db.scalars(statement).all())


@router.get(
    "/{source_id}",
    response_model=SourceResponse,
)
def get_source(
    source_id: UUID,
    db: Session = Depends(get_db),
) -> Source:
    source = db.get(Source, source_id)

    if source is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found",
        )

    return source


@router.patch("/{source_id}", response_model=SourceResponse)
def update_source(
    source_id: UUID,
    payload: SourceUpdate,
    db: Session = Depends(get_db),
) -> Source:
    source = db.get(Source, source_id)

    if source is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found",
        )

    changes = payload.model_dump(exclude_unset=True)

    if not changes or ("name" in changes and changes["name"] is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="At least one valid field must be provided",
        )

    if "category_id" in changes and changes["category_id"] is not None:
        category = db.get(Category, changes["category_id"])

        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

    if "name" in changes:
        source.name = changes["name"]

    if "category_id" in changes:
        source.category_id = changes["category_id"]

    try:
        db.commit()
        db.refresh(source)

        logger.info(
            "Source updated: id=%s name='%s'",
            source.id,
            source.name,
        )

    except IntegrityError:
        db.rollback()

        logger.warning(
            "Failed to update source: id=%s",
            source_id,
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Source could not be updated due to a conflict",
        )

    return source


@router.delete(
    "/{source_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_source(
    source_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    source = db.get(Source, source_id)

    if source is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found",
        )

    try:
        db.delete(source)
        db.commit()

        logger.info(
            "Source deleted: id=%s name='%s'",
            source_id,
            source.name,
        )

    except IntegrityError:
        db.rollback()

        logger.warning(
            "Failed to delete source: id=%s",
            source_id,
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Source could not be deleted due to a conflict",
        )