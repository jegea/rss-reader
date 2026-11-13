from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ArticleListItem(BaseModel):
    id: UUID
    source_id: UUID
    title: str
    url: str | None
    author: str | None
    published_at: datetime | None
    created_at: datetime
    is_read: bool
    is_starred: bool

    model_config = ConfigDict(from_attributes=True)


class ArticleListResponse(BaseModel):
    items: list[ArticleListItem]
    limit: int
    offset: int
    has_more: bool


class ArticleResponse(BaseModel):
    id: UUID
    source_id: UUID
    title: str
    url: str | None
    normalized_url: str | None
    content: str | None
    author: str | None
    published_at: datetime | None
    created_at: datetime
    is_read: bool
    is_starred: bool

    model_config = ConfigDict(from_attributes=True)


class ArticleUpdate(BaseModel):
    is_read: bool | None = None
    is_starred: bool | None = None