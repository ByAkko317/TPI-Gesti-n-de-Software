"""Punto de entrada de la API FastAPI."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import appointments, auth, services, admin

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


app.include_router(auth.router)
app.include_router(services.router)
app.include_router(appointments.router)
app.include_router(admin.router)

# Los routers de services, appointments y admin se montan en próximas etapas.