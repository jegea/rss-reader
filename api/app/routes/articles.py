
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.article import Article
from app.models.source import Source
from app.schemas.article import (
    ArticleListResponse,
    ArticleResponse,
    ArticleUpdate,
)

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("", response_model=ArticleListResponse)
def list_articles(
    source_id: UUID | None = None,
    category_id: UUID | None = None,
    is_read: bool | None = None,
    is_starred: bool | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: Session = Depends(get_db),
) -> ArticleListResponse:
    statement = select(Article)

    if category_id is not None:
        statement = statement.join(Source).where(
            Source.category_id == category_id
        )

    if source_id is not None:
        statement = statement.where(Article.source_id == source_id)

    if is_read is not None:
        statement = statement.where(Article.is_read == is_read)

    if is_starred is not None:
        statement = statement.where(Article.is_starred == is_starred)

    statement = statement.order_by(
        Article.published_at.desc().nulls_last(),
        Article.created_at.desc(),
        Article.id.desc(),
    )

    articles = list(
        db.scalars(
            statement.limit(limit + 1).offset(offset)
        ).all()
    )

    has_more = len(articles) > limit
    items = articles[:limit]

    return ArticleListResponse(
        items=items,
        limit=limit,
        offset=offset,
        has_more=has_more,
    )


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(
    article_id: UUID,
    db: Session = Depends(get_db),
) -> Article:
    article = db.get(Article, article_id)

    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )

    return article


@router.patch("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: UUID,
    article_update: ArticleUpdate,
    db: Session = Depends(get_db),
) -> Article:
    article = db.get(Article, article_id)

    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )

    updates = article_update.model_dump(exclude_unset=True)

    if not updates or any(value is None for value in updates.values()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="At least one valid field must be provided",
        )

    for field, value in updates.items():
        setattr(article, field, value)

    db.commit()

    return article