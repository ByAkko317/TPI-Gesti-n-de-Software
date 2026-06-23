"""Dependencias de FastAPI para autenticación y autorización por rol."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db import get_db
from app.models.user import User, UserRole

# Esquema Bearer: FastAPI lo muestra como "Authorize" en /docs.
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Valida el token y devuelve el usuario autenticado."""
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o ausentes",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise invalid

    payload = decode_access_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise invalid

    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise invalid
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Permite el acceso solo si el usuario autenticado es admin."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador",
        )
    return current_user