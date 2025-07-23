"""add_file_url_to_documents

Revision ID: 06d4bec07a9e
Revises: 641b0287bfe4
Create Date: 2025-07-24 00:08:52.697261

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06d4bec07a9e'
down_revision: Union[str, Sequence[str], None] = '641b0287bfe4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add file_url column to documents table
    op.add_column('documents', sa.Column('file_url', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove file_url column from documents table
    op.drop_column('documents', 'file_url')
