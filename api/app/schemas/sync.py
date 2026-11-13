
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, model_validator


class FeedSyncRequest(BaseModel):
    category_id: UUID | None = None
    source_id: UUID | None = None

    @model_validator(mode="after")
    def validate_filters(self) -> "FeedSyncRequest":
        if self.category_id is not None and self.source_id is not None:
            raise ValueError(
                "category_id and source_id cannot be used together"
            )

        return self


class SourceSyncResponse(BaseModel):
    source_id: UUID
    source_name: str
    status: Literal["updated", "not_modified", "error"]
    entries_count: int
    error: str | None = None


class FeedSyncResponse(BaseModel):
    total_sources: int
    successful_sources: int
    failed_sources: int
    total_entries_found: int
    results: list[SourceSyncResponse]
