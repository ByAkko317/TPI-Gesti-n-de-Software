"""Configuración central del backend, leída desde variables de entorno."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Base de datos
    database_url: str = "postgresql+psycopg://peluqueria:peluqueria@db:5432/peluqueria"

    # Seguridad / JWT (se usa a fondo en la Etapa 2)
    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # Admin sembrado por seed.py
    admin_email: str = "admin@peluqueria.com"
    admin_password: str = "admin1234"
    admin_first_name: str = "Admin"
    admin_last_name: str = "Peluqueria"

    # Integración n8n (no bloqueante; se usa en la etapa de n8n)
    n8n_webhook_url: str | None = None
    # Token compartido que n8n usa para llamar al endpoint de recordatorios.
    internal_api_token: str = "change-me-internal-token"

    # CORS (frontend)
    frontend_origin: str = "http://localhost:5173"

    # Reglas de negocio de turnos
    # Horario de atención (hora local del negocio, formato 24h).
    opening_hour: int = 9
    closing_hour: int = 18
    # Días abiertos: 0=lunes ... 6=domingo. Por defecto L-S (domingo cerrado).
    open_weekdays: str = "0,1,2,3,4,5"
    # Antelación mínima para reservar, en minutos.
    min_advance_minutes: int = 60


@lru_cache
def get_settings() -> Settings:
    return Settings()