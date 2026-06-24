"""Envío de notificaciones a n8n vía webhook.

Principio de diseño: el disparo es *tolerante a fallos*. Si n8n no está
configurado o no responde, la operación de negocio (crear/cancelar turno)
ya se completó y no debe verse afectada. Los errores solo se loguean.
"""
import logging

import httpx

from app.core.config import get_settings
from app.models.appointment import Appointment

logger = logging.getLogger("notifications")
settings = get_settings()

_TIMEOUT = httpx.Timeout(5.0)


def _build_payload(event: str, appointment: Appointment) -> dict:
    """Arma el payload con todo lo que n8n necesita para componer el correo."""
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


def notify(event: str, appointment: Appointment) -> None:
    """Dispara un webhook a n8n. Nunca lanza excepción hacia el caller."""
    if not settings.n8n_webhook_url:
        logger.info("n8n no configurado; se omite notificación '%s'.", event)
        return

    payload = _build_payload(event, appointment)
    try:
        httpx.post(settings.n8n_webhook_url, json=payload, timeout=_TIMEOUT)
        logger.info("Notificación '%s' enviada para turno %s.", event, appointment.id)
    except httpx.HTTPError as exc:
        # No re-lanzamos: la creación/cancelación del turno ya se completó.
        logger.warning(
            "Fallo al notificar '%s' del turno %s: %s", event, appointment.id, exc
        )
