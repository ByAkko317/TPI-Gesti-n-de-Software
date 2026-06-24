"""Schemas del panel de administración (analítica)."""
from pydantic import BaseModel


class RevenueByService(BaseModel):
    service_name: str
    appointments: int
    revenue: float


class Analytics(BaseModel):
    """Métricas resumidas para el dashboard del admin."""

    total_revenue: float          # ingresos de turnos confirmados
    confirmed_appointments: int   # turnos concretados
    cancelled_appointments: int   # turnos cancelados
    total_clients: int            # clientes registrados (rol client)
    new_clients: int              # clientes registrados en el período
    new_clients_period_days: int  # ventana usada para "nuevos"
    revenue_by_service: list[RevenueByService]