"""Reglas de negocio de turnos: horario, antelación y solapamiento.

Manejo de zona horaria: la hora que envía el cliente se interpreta en la
zona del negocio (settings.business_timezone). Todas las comparaciones se
hacen con datetimes 'aware' para evitar desfases.
"""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service

settings = get_settings()


class AvailabilityError(Exception):
    """Se lanza cuando un turno no cumple las reglas de disponibilidad."""


def business_tz() -> ZoneInfo:
    return ZoneInfo(settings.business_timezone)


def _open_weekdays() -> set[int]:
    return {int(d) for d in settings.open_weekdays.split(",") if d.strip() != ""}


def to_business_aware(dt: datetime) -> datetime:
    """Normaliza una fecha a 'aware' en la zona del negocio.

    - Si viene naive (sin zona), se asume que ya está en hora del negocio.
    - Si viene aware (con zona), se convierte a la zona del negocio.
    """
    tz = business_tz()
    if dt.tzinfo is None:
        return dt.replace(tzinfo=tz)
    return dt.astimezone(tz)


def now_business() -> datetime:
    """Hora actual en la zona del negocio (aware)."""
    return datetime.now(business_tz())


def validate_within_business_hours(start_at: datetime, end_at: datetime) -> None:
    """Verifica día abierto y que el turno entre completo en el horario."""
    start = to_business_aware(start_at)
    end = to_business_aware(end_at)

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
    start = to_business_aware(start_at)
    minimum = now_business() + timedelta(minutes=settings.min_advance_minutes)
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
) -> tuple[datetime, datetime]:
    """Valida todas las reglas y devuelve (start_at, end_at) normalizados a aware.

    Lanza AvailabilityError si algo no se cumple.
    """
    start = to_business_aware(start_at)
    end = start + timedelta(minutes=service.duration_min)
    validate_advance(start)
    validate_within_business_hours(start, end)
    if has_overlap(db, start, end):
        raise AvailabilityError("Ya existe un turno en ese horario.")
    return start, end
