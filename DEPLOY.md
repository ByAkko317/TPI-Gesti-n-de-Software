# Guía de despliegue

Arquitectura de despliegue recomendada, con servicios gratuitos:

| Componente | Plataforma | Por qué |
|------------|-----------|---------|
| Frontend | **Vercel** | Deploy directo de apps Vite, gratis |
| Backend | **Render** (Web Service) | Soporta Docker / Python, gratis |
| Base de datos | **Render PostgreSQL** | Postgres gestionado, gratis |
| n8n | **n8n Cloud** o self-host | Webhooks estables para los correos |

---

## 1. Base de datos (Render PostgreSQL)

1. En Render, **New → PostgreSQL**.
2. Anotá la **Internal Database URL** (la usa el backend dentro de Render) y la
   **External** (para correr migraciones desde tu máquina si hace falta).
3. La URL tiene formato `postgresql://usuario:pass@host:5432/db`.
   El backend usa el driver `psycopg`, así que en `DATABASE_URL` reemplazá el
   esquema por `postgresql+psycopg://...`.

---

## 2. Backend (Render Web Service)

1. **New → Web Service**, conectá el repositorio, raíz del servicio: `backend/`.
2. Render detecta el `Dockerfile`. El contenedor ya corre migraciones + seed +
   uvicorn al arrancar.
3. Configurá las **variables de entorno** (ver lista abajo). Como mínimo:
   - `DATABASE_URL` (la Internal URL de Render, con `+psycopg`)
   - `JWT_SECRET` (un valor largo y aleatorio)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (credenciales reales del admin)
   - `INTERNAL_API_TOKEN` (token largo y aleatorio)
   - `FRONTEND_ORIGIN` (la URL pública de Vercel, para CORS)
   - `N8N_WEBHOOK_URL` (si usás n8n en producción)
   - `BUSINESS_TIMEZONE` (ej. `America/Argentina/Buenos_Aires`)
4. Deploy. La API queda en `https://tu-backend.onrender.com`.

> **CORS**: `FRONTEND_ORIGIN` debe coincidir exactamente con el dominio de
> Vercel, o el navegador bloqueará las peticiones.

---

## 3. Frontend (Vercel)

> **Importante**: Vite inyecta `VITE_API_URL` en **tiempo de build**, no en
> runtime. Hay que setearla como variable de entorno en Vercel **antes** del
> build, para que quede compilada en el bundle.

1. En Vercel, **New Project**, importá el repo.
2. **Root Directory**: `frontend`.
3. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
4. **Environment Variables**: agregá
   `VITE_API_URL = https://tu-backend.onrender.com`.
5. Deploy. El frontend queda en `https://tu-app.vercel.app`.
6. Volvé al backend y poné esa URL en `FRONTEND_ORIGIN`; redeploy del backend.

---

## 4. n8n (producción)

Dos opciones:

- **n8n Cloud** (más simple): creás los workflows importando los JSON de `n8n/`,
  configurás SMTP, y usás la URL pública del webhook en `N8N_WEBHOOK_URL` del
  backend.
- **Self-host** (Render/Railway/VPS): desplegás la imagen `n8nio/n8n`. Tené en
  cuenta que en tiers gratuitos que "duermen", el recordatorio por schedule
  puede no dispararse con precisión.

Para el recordatorio, el workflow llama a `GET /internal/reminders` del backend
con el header `X-Internal-Token`. Ese token debe coincidir con
`INTERNAL_API_TOKEN` del backend.

Detalle de configuración en [`n8n/README.md`](./n8n/README.md).

---

## 5. Verificación post-deploy

1. Abrí la URL de Vercel: debería cargar la landing.
2. Registrá un cliente y sacá un turno: debería confirmar.
3. Entrá como admin y revisá el panel.
4. Si configuraste n8n, revisá que llegue el correo de confirmación.
5. Probá `https://tu-backend.onrender.com/docs` para confirmar que la API responde.

---

## Notas

- El primer arranque del backend en Render puede tardar (build de la imagen +
  migraciones). Los planes gratuitos pueden "dormir" tras inactividad y tardar
  unos segundos en la primera petición.
- Cambiá **siempre** `JWT_SECRET`, `ADMIN_PASSWORD` e `INTERNAL_API_TOKEN`
  respecto de los valores de ejemplo.
