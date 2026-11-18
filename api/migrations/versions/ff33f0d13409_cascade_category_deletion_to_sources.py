"""Cascade category deletion to sources

Revision ID: ff33f0d13409
Revises: 02b58101519d
Create Date: 2026-11-18 16:07:55.355858

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'ff33f0d13409'
down_revision: Union[str, Sequence[str], None] = '02b58101519d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint(
        "sources_category_id_fkey",
        "sources",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "sources_category_id_fkey",
        "sources",
        "categories",
        ["category_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "sources_category_id_fkey",
        "sources",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "sources_category_id_fkey",
        "sources",
        "categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )
