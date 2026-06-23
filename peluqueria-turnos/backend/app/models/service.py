"""Modelo de servicio: define duración y precio del turno."""
from sqlalchemy import Boolean, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    # Duración en minutos: el alcance pide entre 30 y 60 según el servicio.
    duration_min: Mapped[int] = mapped_column(Integer)
    # Precio para la analítica de ingresos del panel admin.
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    appointments: Mapped[list["Appointment"]] = relationship(  # noqa: F821
        back_populates="service"
    )
