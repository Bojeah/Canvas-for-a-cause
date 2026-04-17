"""Add currency to artworks

Revision ID: 7a4f2b9c8c31
Revises: 2d8a9b0f6c1e
Create Date: 2026-04-17 21:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7a4f2b9c8c31"
down_revision: Union[str, Sequence[str], None] = "2d8a9b0f6c1e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "artworks",
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="NGN"),
    )
    op.alter_column("artworks", "currency", server_default=None)


def downgrade() -> None:
    op.drop_column("artworks", "currency")
