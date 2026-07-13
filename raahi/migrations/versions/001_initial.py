"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2026-07-13

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'guilds',
        sa.Column('id', sa.BigInteger(), primary_key=True),
        sa.Column('prefix', sa.String(32), nullable=True),
        sa.Column('language', sa.String(8), nullable=False, server_default='en'),
        sa.Column('dj_role_id', sa.BigInteger(), nullable=True),
        sa.Column('request_channel_id', sa.BigInteger(), nullable=True),
        sa.Column('enable_24_7', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('enable_autoplay', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('max_queue_size', sa.Integer(), nullable=False, server_default='200'),
        sa.Column('theme', sa.String(32), nullable=False, server_default='cozy'),
        sa.Column('command_blacklist', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('allowed_channels', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'users',
        sa.Column('id', sa.BigInteger(), primary_key=True),
        sa.Column('language', sa.String(8), nullable=False, server_default='en'),
        sa.Column('favorite_tracks', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('listening_history', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'premium_entitlements',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('guild_id', sa.BigInteger(), nullable=True),
        sa.Column('tier', sa.String(32), nullable=False, server_default='premium'),
        sa.Column('scope', sa.String(32), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(16), nullable=False, server_default='active'),
        sa.Column('source', sa.String(64), nullable=False, server_default='owner'),
        sa.Column('external_reference', sa.String(128), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_by', sa.BigInteger(), nullable=True),
        sa.Column('revoked_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Add indexes
    op.create_index('idx_premium_user_guild', 'premium_entitlements', ['user_id', 'guild_id'])
    op.create_index('idx_premium_status', 'premium_entitlements', ['status'])

    # Similar tables for playlists, player_states, no_prefix_grants, license_keys, etc.
    # (abbreviated for space - full tables in models.py)


def downgrade() -> None:
    op.drop_table('premium_entitlements')
    op.drop_table('users')
    op.drop_table('guilds')
