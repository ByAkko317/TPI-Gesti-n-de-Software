"""Siembra datos iniciales: usuario admin y servicios de ejemplo.

Es idempotente: si los datos ya existen, no los duplica.
"""
from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import hash_password
from app.db import SessionLocal
from app.models import Service, User, UserRole

settings = get_settings()

# Servicios base: duración entre 30 y 60 min, con precio para la analítica.
SERVICES = [
    {"name": "Corte de cabello", "duration_min": 30, "price": 5000},
    {"name": "Corte y barba", "duration_min": 45, "price": 7000},
    {"name": "Coloración", "duration_min": 60, "price": 12000},
    {"name": "Peinado", "duration_min": 30, "price": 4000},
]


def seed() -> None:
    db = SessionLocal()
    try:
        # Admin
        existing_admin = db.scalar(
            select(User).where(User.email == settings.admin_email)
        )
        if existing_admin is None:
            db.add(
                User(
                    first_name=settings.admin_first_name,
                    last_name=settings.admin_last_name,
                    phone="0000000000",
                    email=settings.admin_email,
                    password_hash=hash_password(settings.admin_password),
                    role=UserRole.admin,
                )
            )
            print(f"[seed] Admin creado: {settings.admin_email}")
        else:
            print("[seed] Admin ya existe, se omite.")

        # Servicios
        for s in SERVICES:
            exists = db.scalar(select(Service).where(Service.name == s["name"]))
            if exists is None:
                db.add(Service(**s))
                print(f"[seed] Servicio creado: {s['name']}")

        db.commit()
        print("[seed] Listo.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()