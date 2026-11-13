from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid6 import uuid7

from app.core.database import Base
from app.models.category import Category


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid7,
    )
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(
        Text,
        unique=True,
        nullable=False,
    )
    category_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )
    etag: Mapped[str | None] = mapped_column(
    String(500),
    nullable=True,
    )
    last_modified: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    last_checked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_successful_sync_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    category: Mapped[Category | None] = relationship(
        back_populates="sources",
    )