"""Reglas de negocio de turnos: horario, antelación y solapamiento.

Centraliza la validación para que el router quede limpio y las reglas
sean fáciles de testear y ajustar.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service

settings = get_settings()


class AvailabilityError(Exception):
    """Se lanza cuando un turno no cumple las reglas de disponibilidad."""


def _open_weekdays() -> set[int]:
    return {int(d) for d in settings.open_weekdays.split(",") if d.strip() != ""}


def _as_naive_local(dt: datetime) -> datetime:
    """Normaliza a datetime sin tzinfo para comparar contra el horario local.

    El frontend puede mandar la fecha con o sin zona; trabajamos en la hora
    local del negocio de forma consistente.
    """
    if dt.tzinfo is not None:
        dt = dt.astimezone().replace(tzinfo=None)
    return dt


def validate_within_business_hours(start_at: datetime, end_at: datetime) -> None:
    """Verifica día abierto y que el turno entre completo en el horario."""
    start = _as_naive_local(start_at)
    end = _as_naive_local(end_at)

    if start.weekday() not in _open_weekdays():
        raise AvailabilityError("La peluquería no atiende ese día.")

    opening = start.replace(
        hour=settings.opening_hour, minute=0, second=0, microsecond=0
    )
    closing = start.replace(
        hour=settings.closing_hour, minute=0, second=0, microsecond=0
    )
    if start < opening or end > closing:
        raise AvailabilityError(
            f"El turno debe estar dentro del horario de atención "
            f"({settings.opening_hour}:00 a {settings.closing_hour}:00)."
        )


def validate_advance(start_at: datetime) -> None:
    """Verifica que el turno no sea en el pasado ni con muy poca antelación."""
    now = datetime.now(timezone.utc)
    start = start_at if start_at.tzinfo else start_at.replace(tzinfo=timezone.utc)
    minimum = now + timedelta(minutes=settings.min_advance_minutes)
    if start < minimum:
        raise AvailabilityError(
            f"Debes reservar con al menos {settings.min_advance_minutes} "
            f"minutos de anticipación."
        )


def has_overlap(
    db: Session, start_at: datetime, end_at: datetime, exclude_id: int | None = None
) -> bool:
    """True si existe un turno confirmado que se solapa con [start_at, end_at)."""
    stmt = select(Appointment.id).where(
        and_(
            Appointment.status == AppointmentStatus.confirmed,
            Appointment.start_at < end_at,
            Appointment.end_at > start_at,
        )
    )
    if exclude_id is not None:
        stmt = stmt.where(Appointment.id != exclude_id)
    return db.scalar(stmt) is not None


def validate_new_appointment(
    db: Session, service: Service, start_at: datetime
) -> datetime:
    """Valida todas las reglas y devuelve el end_at calculado.

    Lanza AvailabilityError si algo no se cumple.
    """
    end_at = start_at + timedelta(minutes=service.duration_min)
    validate_advance(start_at)
    validate_within_business_hours(start_at, end_at)
    if has_overlap(db, start_at, end_at):
        raise AvailabilityError("Ya existe un turno en ese horario.")
    return end_at