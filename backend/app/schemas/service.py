"""Schemas de servicios."""
from pydantic import BaseModel, ConfigDict


class ServiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    duration_min: int
    price: float
    active: bool