"""add_timezone_support_to_users

Revision ID: 46994e5e94b4
Revises: 88ab075244d0
Create Date: 2025-08-08 00:00:42.975020

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '46994e5e94b4'
down_revision: Union[str, Sequence[str], None] = '88ab075244d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
