"""Endpoints del panel de administración (solo admin)."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service
from app.models.user import User, UserRole
from app.schemas.admin import Analytics, RevenueByService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/analytics", response_model=Analytics)
def analytics(
    db: Session = Depends(get_db),
    period_days: int = Query(
        default=30, ge=1, le=365, description="Ventana para 'clientes nuevos'"
    ),
    _admin: User = Depends(require_admin),
) -> Analytics:
    """Devuelve las métricas resumidas del negocio. Requiere rol admin."""
    confirmed = AppointmentStatus.confirmed
    cancelled = AppointmentStatus.cancelled

    # Ingresos y cantidad de turnos confirmados (join con servicio por el precio).
    total_revenue = db.scalar(
        select(func.coalesce(func.sum(Service.price), 0))
        .join(Appointment, Appointment.service_id == Service.id)
        .where(Appointment.status == confirmed)
    )
    confirmed_count = db.scalar(
        select(func.count(Appointment.id)).where(Appointment.status == confirmed)
    )
    cancelled_count = db.scalar(
        select(func.count(Appointment.id)).where(Appointment.status == cancelled)
    )

    # Clientes registrados y nuevos en el período.
    total_clients = db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.client)
    )
    since = datetime.now(timezone.utc) - timedelta(days=period_days)
    new_clients = db.scalar(
        select(func.count(User.id))
        .where(User.role == UserRole.client)
        .where(User.created_at >= since)
    )

    # Ingresos por servicio (turnos confirmados), ordenado de mayor a menor.
    rows = db.execute(
        select(
            Service.name,
            func.count(Appointment.id),
            func.coalesce(func.sum(Service.price), 0),
        )
        .join(Appointment, Appointment.service_id == Service.id)
        .where(Appointment.status == confirmed)
        .group_by(Service.name)
        .order_by(func.coalesce(func.sum(Service.price), 0).desc())
    ).all()
    revenue_by_service = [
        RevenueByService(service_name=name, appointments=cnt, revenue=float(rev))
        for name, cnt, rev in rows
    ]

    return Analytics(
        total_revenue=float(total_revenue or 0),
        confirmed_appointments=confirmed_count or 0,
        cancelled_appointments=cancelled_count or 0,
        total_clients=total_clients or 0,
        new_clients=new_clients or 0,
        new_clients_period_days=period_days,
        revenue_by_service=revenue_by_service,
    )