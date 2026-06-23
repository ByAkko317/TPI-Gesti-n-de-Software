"""Utilidades de seguridad: hash y verificación de contraseñas con bcrypt.

Se usa bcrypt directamente (sin passlib) para evitar problemas de
compatibilidad con las versiones nuevas de bcrypt. Las funciones de JWT
se agregan en la etapa de autenticación.
"""
import bcrypt

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
