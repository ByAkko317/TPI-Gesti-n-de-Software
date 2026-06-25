"""Utilidades de seguridad: hash de contraseñas (bcrypt) y tokens JWT.

Se usa bcrypt directamente (sin passlib) para evitar problemas de
compatibilidad con las versiones nuevas de bcrypt.
"""
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()

# bcrypt no admite contraseñas de más de 72 bytes; las truncamos de forma
# segura antes de hashear/verificar para mantener consistencia.
_MAX_BYTES = 72


def _to_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:_MAX_BYTES]


def hash_password(password: str) -> str:
    """Devuelve el hash bcrypt de la contraseña, listo para guardar."""
    hashed = bcrypt.hashpw(_to_bytes(password), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Compara una contraseña en texto plano contra su hash almacenado."""
    return bcrypt.checkpw(_to_bytes(password), password_hash.encode("utf-8"))


def create_access_token(user_id: int, role: str) -> str:
    """Genera un JWT firmado con el id del usuario y su rol."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    """Decodifica y valida un JWT. Devuelve el payload o None si es inválido."""
    try:
        return jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except JWTError:
        return None