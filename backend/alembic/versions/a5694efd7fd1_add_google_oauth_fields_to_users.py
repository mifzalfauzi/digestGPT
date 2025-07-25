"""add_google_oauth_fields_to_users

Revision ID: a5694efd7fd1
Revises: 06d4bec07a9e
Create Date: 2025-07-25 16:11:20.355605

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5694efd7fd1'
down_revision: Union[str, Sequence[str], None] = '06d4bec07a9e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add Google OAuth fields to users table
    op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('profile_picture', sa.String(), nullable=True))
    
    # Create index on google_id for faster lookups
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)
    
    # Make password_hash nullable for Google OAuth users
    op.alter_column('users', 'password_hash', nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Make password_hash non-nullable again
    op.alter_column('users', 'password_hash', nullable=False)
    
    # Drop index on google_id
    op.drop_index('ix_users_google_id', table_name='users')
    
    # Remove Google OAuth fields from users table
    op.drop_column('users', 'profile_picture')
    op.drop_column('users', 'google_id')
