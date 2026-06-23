"""Punto de entrada de la API FastAPI."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="Peluquería - Gestión de Turnos", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Chequeo simple de que la API está viva."""
    return {"status": "ok"}


# Los routers (auth, services, appointments, admin) se montan en próximas etapas.
