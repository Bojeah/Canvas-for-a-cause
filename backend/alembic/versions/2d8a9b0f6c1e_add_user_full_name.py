"""Add full_name to users

Revision ID: 2d8a9b0f6c1e
Revises: 016d755b2895
Create Date: 2026-04-17 17:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2d8a9b0f6c1e"
down_revision: Union[str, Sequence[str], None] = "016d755b2895"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("full_name", sa.String(length=255), nullable=True))

    op.execute(
        """
        UPDATE users
        SET full_name = CASE
            WHEN role = 'admin' THEN 'Administrator'
            ELSE COALESCE(NULLIF(TRIM(split_part(email, '@', 1)), ''), 'Bidder')
        END
        WHERE full_name IS NULL
        """
    )

    op.alter_column("users", "full_name", existing_type=sa.String(length=255), nullable=False)


def downgrade() -> None:
    op.drop_column("users", "full_name")
