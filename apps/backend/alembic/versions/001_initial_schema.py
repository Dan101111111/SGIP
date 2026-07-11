"""initial_schema

Revision ID: 001
Revises:
Create Date: 2026-07-10 10:30:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'dmas',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('code', sa.String(50), unique=True, index=True, nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('district', sa.String(100), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('status', sa.String(50), server_default='ACTIVE'),
        sa.Column('population', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(255), nullable=True),
    )

    op.create_table(
        'sensors',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('code', sa.String(50), unique=True, index=True, nullable=False),
        sa.Column('dma_id', sa.String(50), sa.ForeignKey('dmas.code'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('unit', sa.String(20), nullable=False),
        sa.Column('status', sa.String(50), server_default='ACTIVE'),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
    )

    op.create_table(
        'telemetry_readings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('timestamp', sa.DateTime(), index=True, nullable=False),
        sa.Column('dma_id', sa.String(50), sa.ForeignKey('dmas.code'), nullable=False),
        sa.Column('sensor_id', sa.String(50), nullable=False),
        sa.Column('pressure_mca', sa.Float(), nullable=False),
        sa.Column('flow_lps', sa.Float(), nullable=False),
        sa.Column('source', sa.String(50), server_default='mock'),
        sa.Column('quality_flag', sa.String(50), server_default='GOOD'),
    )

    op.create_table(
        'anomalies',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('telemetry_id', sa.Integer(), nullable=False),
        sa.Column('dma_id', sa.String(50), sa.ForeignKey('dmas.code'), nullable=False),
        sa.Column('dma_name', sa.String(100), nullable=False),
        sa.Column('anomaly_score', sa.Float(), nullable=False),
        sa.Column('severity', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), server_default='PENDING'),
        sa.Column('detected_at', sa.DateTime(), nullable=False),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('pressure_variation', sa.Float(), nullable=True),
        sa.Column('flow_variation', sa.Float(), nullable=True),
        sa.Column('estimated_loss_volume', sa.Float(), nullable=True),
        sa.Column('description', sa.String(255), nullable=True),
    )

    op.create_table(
        'incident_tickets',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('code', sa.String(50), unique=True, index=True, nullable=False),
        sa.Column('anomaly_id', sa.Integer(), sa.ForeignKey('anomalies.id'), nullable=False),
        sa.Column('dma_id', sa.String(50), sa.ForeignKey('dmas.code'), nullable=False),
        sa.Column('dma_name', sa.String(100), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.String(500), nullable=False),
        sa.Column('priority', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), server_default='NEW'),
        sa.Column('assigned_to', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('sla_due_at', sa.DateTime(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.Column('response_time_minutes', sa.Integer(), nullable=True),
        sa.Column('resolution_time_minutes', sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('incident_tickets')
    op.drop_table('anomalies')
    op.drop_table('telemetry_readings')
    op.drop_table('sensors')
    op.drop_table('dmas')
