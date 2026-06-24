"""Endpoints internos consumidos por n8n (no por el frontend).

Protegidos con un token compartido simple (header X-Internal-Token),
suficiente para comunicación máquina-a-máquina en este alcance.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.db import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import AppointmentRead

router = APIRouter(prefix="/internal", tags=["internal"])
settings = get_settings()


def verify_internal_token(x_internal_token: str = Header(default="")) -> None:
    """Valida el token compartido que usa n8n."""
    if x_internal_token != settings.internal_api_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token interno inválido"
        )


@router.get(
    "/reminders",
    response_model=list[AppointmentRead],
    dependencies=[Depends(verify_internal_token)],
)
def reminders(db: Session = Depends(get_db)) -> list[Appointment]:
    """Devuelve los turnos confirmados que empiezan en ~24 h.

    n8n llama a este endpoint con un Schedule Trigger y envía el recordatorio
    por cada turno devuelto. La ventana es de 24 a 25 h para que, corriendo
    el schedule cada hora, cada turno se notifique una sola vez.
    """
    now = datetime.now(timezone.utc)
    window_start = now + timedelta(hours=24)
    window_end = now + timedelta(hours=25)

    stmt = (
        select(Appointment)
        .options(joinedload(Appointment.service), joinedload(Appointment.user))
        .where(Appointment.status == AppointmentStatus.confirmed)
        .where(Appointment.start_at >= window_start)
        .where(Appointment.start_at < window_end)
        .order_by(Appointment.start_at)
    )
    return list(db.scalars(stmt).unique())
