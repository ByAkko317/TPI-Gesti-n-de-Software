"""Schemas de turnos (appointments)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.appointment import AppointmentStatus, CancelledBy
from app.schemas.service import ServiceRead


class AppointmentCreate(BaseModel):
    """Datos para crear un turno. end_at lo calcula el backend."""

    service_id: int
    start_at: datetime


class AppointmentCancel(BaseModel):
    """Comentario de cancelación (obligatoriedad la valida el endpoint según rol)."""

    comment: str | None = Field(default=None, max_length=500)


class ClientMini(BaseModel):
    """Datos mínimos del cliente, para que el admin vea de quién es el turno."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: str
    phone: str


class AppointmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    start_at: datetime
    end_at: datetime
    status: AppointmentStatus
    cancelled_by: CancelledBy | None
    cancellation_comment: str | None
    service: ServiceRead
    user: ClientMini