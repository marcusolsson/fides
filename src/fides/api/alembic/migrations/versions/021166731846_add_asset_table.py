"""add asset table

Revision ID: 021166731846
Revises: 58f8edd66b69
Create Date: 2025-01-22 22:14:35.548869

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "021166731846"
down_revision = "58f8edd66b69"
branch_labels = None
depends_on = None


def upgrade():

    op.create_table(
        "asset",
        sa.Column("id", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("asset_type", sa.String(), nullable=False),
        sa.Column("domain", sa.String(), nullable=True),
        sa.Column(
            "parent",
            postgresql.ARRAY(sa.String()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("parent_domain", sa.String(), nullable=True),
        sa.Column(
            "locations",
            postgresql.ARRAY(sa.String()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("with_consent", sa.BOOLEAN(), nullable=False),
        sa.Column(
            "data_uses",
            postgresql.ARRAY(sa.String()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column(
            "meta",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("base_url", sa.String(), nullable=True),
        sa.Column("system_id", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["system_id"], ["ctl_systems.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_asset_asset_type"), "asset", ["asset_type"], unique=False)
    op.create_index(op.f("ix_asset_domain"), "asset", ["domain"], unique=False)
    op.create_index(op.f("ix_asset_id"), "asset", ["id"], unique=False)
    op.create_index(op.f("ix_asset_name"), "asset", ["name"], unique=False)
    op.create_index(op.f("ix_asset_system_id"), "asset", ["system_id"], unique=False)

    op.create_index(
        op.f("ix_asset_name_asset_type_domain_base_url_system_id"),
        "asset",
        [
            "name",
            "asset_type",
            "domain",
            sa.text("coalesce(md5(base_url), 'NULL')"),
            "system_id",
        ],
        unique=True,
    )

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f("ix_asset_system_id"), table_name="asset")
    op.drop_index(op.f("ix_asset_name"), table_name="asset")
    op.drop_index(op.f("ix_asset_id"), table_name="asset")
    op.drop_index(op.f("ix_asset_domain"), table_name="asset")
    op.drop_index(op.f("ix_asset_asset_type"), table_name="asset")
    op.drop_index(
        op.f("ix_asset_name_asset_type_domain_base_url_system_id"), table_name="asset"
    )
    op.drop_table("asset")
    # ### end Alembic commands ###
