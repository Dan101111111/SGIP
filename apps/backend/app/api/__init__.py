from app.api.routes_telemetry import router as telemetry_router
from app.api.routes_anomalies import router as anomalies_router
from app.api.routes_incidents import router as incidents_router
from app.api.routes_kpis import router as kpis_router
from app.api.routes_dmas import router as dmas_router

__all__ = [
    "telemetry_router",
    "anomalies_router",
    "incidents_router",
    "kpis_router",
    "dmas_router"
]
