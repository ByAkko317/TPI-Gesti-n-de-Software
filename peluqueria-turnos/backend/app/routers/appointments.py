"""Endpoints de turnos (appointments).

El control de permisos es por rol:
- cliente: solo crea y ve/cancela sus propios turnos.
- admin: ve todos (con filtros) y cancela cualquiera (comentario obligatorio).
"""
from datetime import date, datetime, time

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.db import get_db
from app.models.appointment import (
    Appointment,
    AppointmentStatus,
    CancelledBy,
)
from app.models.service import Service
from app.models.user import User, UserRole
from app.schemas.appointment import (
    AppointmentCancel,
    AppointmentCreate,
    AppointmentRead,
)
from app.services.availability import (
    AvailabilityError,
    business_tz,
    validate_new_appointment,
)
from app.services.notifications import build_payload, notify

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _base_query():
    """Query con relaciones cargadas, ordenada por fecha de inicio."""
    return (
        select(Appointment)
        .options(joinedload(Appointment.service), joinedload(Appointment.user))
        .order_by(Appointment.start_at)
    )


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
def create_appointment(
    data: AppointmentCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Appointment:
    """Crea un turno para el usuario autenticado, validando disponibilidad."""
    service = db.get(Service, data.service_id)
    if service is None or not service.active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado"
        )

    try:
        start_at, end_at = validate_new_appointment(db, service, data.start_at)
    except AvailabilityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc

    appointment = Appointment(
        user_id=current_user.id,
        service_id=service.id,
        start_at=start_at,
        end_at=end_at,
        status=AppointmentStatus.confirmed,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    # Armamos el payload con la sesión todavía abierta y disparamos la
    # notificación en segundo plano (no bloqueante, tras responder).
    payload = build_payload("confirmation", appointment)
    background.add_task(notify, payload)
    return appointment


@router.get("", response_model=list[AppointmentRead])
def list_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    day: date | None = Query(default=None, description="Filtrar por día (solo admin)"),
    client_id: int | None = Query(
        default=None, description="Filtrar por cliente (solo admin)"
    ),
) -> list[Appointment]:
    """Lista turnos. El cliente ve solo los suyos; el admin ve todos con filtros."""
    stmt = _base_query()

    if current_user.role == UserRole.client:
        # El cliente está restringido a sus propios turnos, sin importar filtros.
        stmt = stmt.where(Appointment.user_id == current_user.id)
    else:
        # Admin: aplica filtros opcionales.
        if client_id is not None:
            stmt = stmt.where(Appointment.user_id == client_id)
        if day is not None:
            tz = business_tz()
            start = datetime.combine(day, time.min).replace(tzinfo=tz)
            end = datetime.combine(day, time.max).replace(tzinfo=tz)
            stmt = stmt.where(Appointment.start_at >= start).where(
                Appointment.start_at <= end
            )

    return list(db.scalars(stmt).unique())


@router.post("/{appointment_id}/cancel", response_model=AppointmentRead)
def cancel_appointment(
    appointment_id: int,
    data: AppointmentCancel,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Appointment:
    """Cancela un turno.

    - Cliente: solo sus turnos, comentario opcional.
    - Admin: cualquier turno, comentario obligatorio.
    """
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado"
        )

    is_admin = current_user.role == UserRole.admin

    # Un cliente no puede tocar turnos ajenos.
    if not is_admin and appointment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes cancelar un turno que no es tuyo",
        )

    if appointment.status == AppointmentStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="El turno ya está cancelado"
        )

    # El admin debe justificar la cancelación.
    if is_admin and not (data.comment and data.comment.strip()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El administrador debe indicar un comentario de cancelación",
        )

    appointment.status = AppointmentStatus.cancelled
    appointment.cancelled_by = CancelledBy.admin if is_admin else CancelledBy.client
    appointment.cancellation_comment = data.comment
    db.commit()
    db.refresh(appointment)
    # Payload armado con la sesión abierta; incluye 'cancelled_by' para que
    # n8n use el mensaje correcto según quién canceló.
    payload = build_payload("cancellation", appointment)
    background.add_task(notify, payload)
    return appointment
