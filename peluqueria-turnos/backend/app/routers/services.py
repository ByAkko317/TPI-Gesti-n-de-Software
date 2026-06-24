"""Endpoints de servicios."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.service import Service
from app.schemas.service import ServiceRead

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceRead])
def list_services(db: Session = Depends(get_db)) -> list[Service]:
    """Lista los servicios activos disponibles para reservar."""
    return list(db.scalars(select(Service).where(Service.active.is_(True))))