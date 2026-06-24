# Automatizaciones n8n

Esta carpeta contiene los flujos de automatización para los correos del sistema.

## Flujos incluidos

| Archivo | Qué hace | Disparador |
|---|---|---|
| `workflow_notificaciones.json` | Envía el correo de **confirmación** o de **cancelación** según el evento. El texto de cancelación cambia si canceló el admin o el cliente. | Webhook que llama el backend |
| `workflow_recordatorio.json` | Envía el correo **recordatorio 24 h** antes del turno. | Schedule (cada 1 hora) |

## Cómo funciona la integración

- **Confirmación / cancelación:** al crear o cancelar un turno, el backend hace un `POST` al webhook de n8n con todos los datos del turno, el servicio y el cliente. El campo `event` (`confirmation` / `cancellation`) decide qué correo se manda. El disparo es **no bloqueante**: si n8n está caído, el turno igual se crea/cancela.
- **Recordatorio:** n8n, cada hora, hace un `GET` a `/internal/reminders` del backend (con el header `X-Internal-Token`). El backend devuelve los turnos que empiezan dentro de 24–25 h, y n8n envía un correo por cada uno. La lógica de *qué* turnos recordar vive en el backend.

## Importar los flujos

1. Abrí n8n (local: `http://localhost:5678`).
2. Menú **Workflows → Import from File** y elegí cada `.json`.
3. En cada nodo de email (`Email confirmación`, `Email cancelación`, `Email recordatorio`):
   - Configurá una **credencial SMTP** (Gmail, Mailtrap, SendGrid, etc.). Donde dice `REEMPLAZAR_CREDENCIAL_SMTP`, seleccioná la tuya.
   - Ajustá el `fromEmail` a tu remitente.
4. En `workflow_recordatorio.json`, nodo **GET turnos a recordar**: reemplazá `REEMPLAZAR_INTERNAL_API_TOKEN` por el valor de `INTERNAL_API_TOKEN` de tu `.env`.
5. Activá ambos workflows (toggle **Active**).

## Conectar el backend con n8n

En el `.env` del backend, configurá la URL del webhook de notificaciones:

```
N8N_WEBHOOK_URL=http://n8n:5678/webhook/peluqueria-notificaciones
INTERNAL_API_TOKEN=un-token-secreto-largo
```

- En **local con Docker Compose**, `http://n8n:5678` resuelve por el nombre del servicio.
- En **producción**, usá la URL pública de tu instancia de n8n.
- Si `N8N_WEBHOOK_URL` queda vacío, el backend simplemente omite las notificaciones (útil para desarrollo sin correos).

## Probar rápido

1. Sacá un turno desde la app (o desde `/docs`).
2. En n8n, la ejecución del webhook debería aparecer en **Executions**.
3. Revisá la casilla del cliente (o Mailtrap si usás un SMTP de prueba).

> Para probar SMTP sin mandar correos reales, [Mailtrap](https://mailtrap.io) es la opción más simple: te da credenciales SMTP y una bandeja de entrada de prueba.
