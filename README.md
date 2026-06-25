# Estudio · Gestión de turnos para peluquería

Sistema web para reservar y administrar turnos de una peluquería: los clientes
sacan turno eligiendo servicio y horario disponible, reciben confirmación y
recordatorio por correo, y un administrador gestiona la agenda completa con
métricas del negocio.

Proyecto desarrollado como TP integrador de **desarrollo ágil asistido por IA**
(en equipo con Claude).

---

## Funcionalidades

- **Registro e inicio de sesión** con autenticación JWT y dos roles (cliente / admin).
- **Sacar turno**: elección de servicio (cada uno con su duración y precio),
  día y horario disponible. Solo se muestran horarios libres.
- **Validaciones de agenda**: sin solapamientos, dentro del horario de atención,
  con antelación mínima, y duración según el servicio.
- **Mis turnos** (cliente): calendario mensual, detalle por día y cancelación.
- **Panel admin**: analítica (ingresos, clientes, turnos) y agenda completa con
  filtro por cliente y cancelación con comentario obligatorio.
- **Automatizaciones (n8n)**: correo de confirmación, recordatorio 24 h antes y
  aviso de cancelación con mensaje distinto según quién cancela.
- **Permisos**: el cliente solo ve y gestiona sus turnos; el admin ve todo. El
  backend valida los permisos (no se confía en el frontend).

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Python, FastAPI, SQLAlchemy 2, Alembic, JWT (python-jose), bcrypt |
| Base de datos | PostgreSQL |
| Automatización | n8n (workflows exportables) |
| Contenedores | Docker / Docker Compose |
| IA | Claude (diseño, implementación, auditoría) |

---

## Estructura del repositorio

```
peluqueria-turnos/
├── backend/            API FastAPI (auth, turnos, servicios, admin, n8n)
│   ├── app/
│   │   ├── core/       config, seguridad (JWT/bcrypt), dependencias de auth
│   │   ├── models/     entidades SQLAlchemy (User, Service, Appointment)
│   │   ├── schemas/    contratos Pydantic de entrada/salida
│   │   ├── routers/    endpoints por dominio
│   │   └── services/   lógica de negocio (disponibilidad, notificaciones)
│   ├── alembic/        migraciones de base de datos
│   └── seed.py         siembra admin + servicios de ejemplo
├── frontend/           SPA React + TS + Tailwind
│   └── src/
│       ├── api/        cliente HTTP y llamadas por dominio
│       ├── auth/       contexto de sesión
│       ├── components/ piezas reutilizables (calendario, tarjetas, modal)
│       ├── lib/        lógica pura (slots, calendario)
│       └── pages/      pantallas
├── n8n/                workflows de automatización + guía
├── docker-compose.yml  orquestación local (db + backend + n8n + frontend)
└── .env.example        plantilla de variables de entorno
```

---

## Puesta en marcha (local con Docker)

Requisito: **Docker Desktop**.

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPO>
cd peluqueria-turnos

# 2. Crear el archivo de entorno a partir de la plantilla
cp .env.example .env

# 3. Levantar todo
docker compose up --build
```

Servicios disponibles:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend (API) | http://localhost:8000 |
| Documentación API (Swagger) | http://localhost:8000/docs |
| n8n | http://localhost:5678 |

Al arrancar, el backend aplica migraciones y siembra un usuario admin y cuatro
servicios de ejemplo.

### Usuario de prueba

- **Admin**: `admin@peluqueria.com` / `admin1234` (definido en `.env`).
- **Cliente**: registrá uno nuevo desde la pantalla de registro.

> Cambiá las credenciales del admin y los tokens en producción (ver Variables de entorno).

---

## Puesta en marcha sin Docker (desarrollo)

<details>
<summary>Backend</summary>

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # en Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Necesitás un PostgreSQL corriendo y DATABASE_URL apuntando a él.
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```
</details>

<details>
<summary>Frontend</summary>

```bash
cd frontend
npm install
cp .env.example .env     # ajustá VITE_API_URL si hace falta
npm run dev
```
</details>

---

## Variables de entorno

Ver detalle completo en la sección correspondiente de este README más abajo y en
`.env.example`. Las más importantes:

- `DATABASE_URL` — conexión a PostgreSQL.
- `JWT_SECRET` — secreto para firmar tokens (cambiar en producción).
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credenciales del admin sembrado.
- `N8N_WEBHOOK_URL` — webhook de n8n para notificaciones (opcional).
- `INTERNAL_API_TOKEN` — token que usa n8n para el endpoint de recordatorios.
- `BUSINESS_TIMEZONE` — zona horaria del negocio para las validaciones de turnos.

---

## Automatizaciones n8n

Los workflows están en `n8n/` y se importan desde la interfaz de n8n. Cubren
confirmación, recordatorio 24 h y cancelación. La guía de importación y
configuración SMTP está en [`n8n/README.md`](./n8n/README.md).

El backend funciona aunque n8n no esté configurado: si `N8N_WEBHOOK_URL` está
vacío, simplemente no se envían correos (el resto del sistema sigue operativo).

---

## API

La documentación interactiva (Swagger) está en `/docs`. Resumen de endpoints:

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/auth/register` | público | Registrar cliente |
| POST | `/auth/login` | público | Iniciar sesión |
| GET | `/auth/me` | autenticado | Datos del usuario actual |
| GET | `/services` | público | Listar servicios activos |
| POST | `/appointments` | autenticado | Crear turno |
| GET | `/appointments` | autenticado | Listar turnos (cliente: propios; admin: todos + filtros) |
| POST | `/appointments/{id}/cancel` | autenticado | Cancelar turno |
| GET | `/admin/analytics` | admin | Métricas del negocio |
| GET | `/internal/reminders` | token interno | Turnos a recordar (consumido por n8n) |

---

## Despliegue

Guía completa en [`DEPLOY.md`](./DEPLOY.md). En resumen: frontend en Vercel,
backend y base de datos en Render, y n8n en su instancia (cloud o self-host).

---

## Estado actual y alcance

El sistema está completo para el alcance del proyecto. Las automatizaciones de
n8n requieren configurar credenciales SMTP propias para enviar correos reales
(se recomienda Mailtrap para pruebas). El recordatorio de 24 h depende de que el
workflow de n8n esté activo.
