"""Schemas de usuario para entrada y salida de la API."""
from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class UserRegister(BaseModel):
    """Datos para registrar un cliente nuevo."""

    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=1, max_length=40)
    email: EmailStr
    birth_date: date | None = None
    password: str = Field(min_length=6, max_length=128)


class UserRead(BaseModel):
    """Representación pública de un usuario (sin contraseña)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    birth_date: date | None
    role: UserRole