"""Envío de notificaciones a n8n vía webhook.

Principio de diseño: el disparo es *tolerante a fallos*. Si n8n no está
configurado o no responde, la operación de negocio (crear/cancelar turno)
ya se completó y no debe verse afectada. Los errores solo se loguean.

El payload se arma con `build_payload` mientras la sesión de base de datos
sigue abierta (en el router). `notify` recibe el dict ya listo, así la tarea
en segundo plano no toca el ORM con la sesión ya cerrada.
"""
import logging

import httpx

from app.core.config import get_settings
from app.models.appointment import Appointment

logger = logging.getLogger("notifications")
settings = get_settings()

_TIMEOUT = httpx.Timeout(5.0)


def build_payload(event: str, appointment: Appointment) -> dict:
    """Arma el payload con todo lo que n8n necesita para componer el correo.

    Debe llamarse con la sesión de DB todavía abierta (accede a relaciones).
    """
    user = appointment.user
    service = appointment.service
    return {
        "event": event,  # "confirmation" | "cancellation"
        "appointment": {
            "id": appointment.id,
            "start_at": appointment.start_at.isoformat(),
            "end_at": appointment.end_at.isoformat(),
            "status": appointment.status.value,
            "cancelled_by": (
                appointment.cancelled_by.value
                if appointment.cancelled_by is not None
                else None
            ),
            "cancellation_comment": appointment.cancellation_comment,
        },
        "service": {"name": service.name, "duration_min": service.duration_min},
        "client": {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
        },
    }


def notify(payload: dict) -> None:
    """Dispara un webhook a n8n con el payload ya armado.

    Nunca lanza excepción hacia el caller.
    """
    event = payload.get("event", "?")
    appointment_id = payload.get("appointment", {}).get("id", "?")

    if not settings.n8n_webhook_url:
        logger.info("n8n no configurado; se omite notificación '%s'.", event)
        return

    try:
        httpx.post(settings.n8n_webhook_url, json=payload, timeout=_TIMEOUT)
        logger.info("Notificación '%s' enviada para turno %s.", event, appointment_id)
    except httpx.HTTPError as exc:
        # No re-lanzamos: la creación/cancelación del turno ya se completó.
        logger.warning(
            "Fallo al notificar '%s' del turno %s: %s", event, appointment_id, exc
        )
