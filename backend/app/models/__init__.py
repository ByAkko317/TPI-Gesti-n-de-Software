"""Reexporta los modelos para que Alembic los detecte vía Base.metadata."""
from app.models.appointment import (
    Appointment,
    AppointmentStatus,
    CancelledBy,
)
from app.models.service import Service
from app.models.user import User, UserRole

__all__ = [
    "Appointment",
    "AppointmentStatus",
    "CancelledBy",
    "Service",
    "User",
    "UserRole",
]
