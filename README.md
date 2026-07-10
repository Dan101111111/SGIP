# SGIP-CAP

**Sistema de Gestión Integral de Pérdidas — Sector Moche (CAP)**

Sistema MVP para la detección de anomalías, gestión de incidencias y monitoreo de telemetría en el sector Moche (Trujillo, Perú), operado por **SEDALIB S.A.** El sistema se enfoca en un único DMA (`DMA-MO-01`) utilizando datos de presión y caudal para identificar fugas, generar tickets ITIL y estimar volúmenes de pérdida de agua.

---

## Arquitectura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React App  │────▶│  FastAPI     │◀───▶│  PostgreSQL  │
│  (Frontend)  │     │  (Backend)   │     │     (15)     │
└──────────────┘     │              │     └──────────────┘
       │             │  + Celery    │     ┌──────────────┐
       │             │  + WebSocket │◀───▶│    Redis 7   │
       ▼             └──────┬───────┘     └──────────────┘
  WebSocket                 │
  (tiempo real)     ┌───────▼───────┐
                    │   ML Engine   │
                    │  (Isolation   │
                    │   Forest)     │
                    └───────────────┘
```

### Stack tecnológico

| Capa          | Tecnología                                |
|---------------|-------------------------------------------|
| Backend       | Python 3.11, FastAPI 0.104, Uvicorn 0.24 |
| Base de datos | PostgreSQL 15, SQLAlchemy 2.0, Alembic   |
| Cache / Broker| Redis 7                                   |
| ML            | scikit-learn (IsolationForest), Pandas    |
| Frontend      | React 18, Vite 4.5, TypeScript           |
| Tiempo real   | WebSockets (FastAPI nativo)               |
| Autenticación | JWT (python-jose), bcrypt (passlib)      |
| Tareas asínc. | Celery 5.3 (en preparación)              |
| Testing       | pytest, pytest-asyncio, httpx             |
| Contenedores  | Docker, Docker Compose                    |

---

## Estructura del proyecto

```
SGIP/
├── apps/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── main.py                    # Punto de entrada FastAPI
│   │   │   ├── api/                       # Controladores REST
│   │   │   │   ├── routes_telemetry.py
│   │   │   │   ├── routes_anomalies.py
│   │   │   │   ├── routes_incidents.py
│   │   │   │   ├── routes_kpis.py
│   │   │   │   ├── routes_dmas.py
│   │   │   │   ├── routes_alerts.py
│   │   │   │   └── routes_reports.py
│   │   │   ├── core/                      # Configuración y utilidades
│   │   │   │   ├── config.py              # Variables de entorno (pydantic-settings)
│   │   │   │   ├── exceptions.py
│   │   │   │   └── security.py            # JWT + bcrypt
│   │   │   ├── domain/                    # Modelos de dominio (Pydantic)
│   │   │   ├── infrastructure/            # ORM + repositorios
│   │   │   │   ├── database.py
│   │   │   │   ├── models.py              # Modelos SQLAlchemy
│   │   │   │   └── repositories.py
│   │   │   ├── schemas/                   # Schemas de request/response
│   │   │   ├── services/                  # Lógica de negocio
│   │   │   │   ├── telemetry_service.py
│   │   │   │   ├── anomaly_service.py
│   │   │   │   ├── incident_service.py
│   │   │   │   ├── kpi_service.py
│   │   │   │   ├── alert_service.py
│   │   │   │   ├── report_service.py
│   │   │   │   └── notification_service.py
│   │   │   ├── ml/                        # Motor de detección de anomalías
│   │   │   │   ├── feature_engineering.py
│   │   │   │   ├── isolation_forest_model.py
│   │   │   │   └── model_registry.py
│   │   │   ├── providers/                 # Fuentes de datos
│   │   │   │   ├── base_provider.py
│   │   │   │   ├── mock_provider.py
│   │   │   │   ├── csv_provider.py
│   │   │   │   └── scada_export_provider.py
│   │   │   ├── simulation/                # Simulación hidráulica
│   │   │   │   ├── hydraulic_simulator.py
│   │   │   │   └── scenario_generator.py
│   │   │   ├── websocket/                 # Comunicación en tiempo real
│   │   │   └── scripts/
│   │   │       ├── init_moche.py
│   │   │       └── generate_moche_data.py
│   │   ├── alembic/                       # Migraciones (pendientes)
│   │   └── requirements.txt
│   └── frontend/                          # React + Vite (en construcción)
│       ├── src/
│       │   ├── features/
│       │   │   ├── anomalies/
│       │   │   ├── incidents/
│       │   │   ├── kpis/
│       │   │   └── telemetry/
│       │   └── pages/
│       │       ├── dashboard/
│       │       ├── monitoring/
│       │       ├── incidents/
│       │       ├── analytics/
│       │       ├── dmas/
│       │       └── settings/
│       └── package.json
├── data/
│   ├── mock/moche_context.json
│   ├── samples/
│   └── sedalib_imports/                   # Exportaciones SCADA (CSV)
├── docs/                                  # Documentación (en progreso)
├── docker-compose.yml
├── Dockerfile.backend
└── Dockerfile.frontend
```

---

## Requisitos

- **Docker** y **Docker Compose** (recomendado)
- O en su defecto: Python 3.11, PostgreSQL 15, Redis 7, Node 18

---

## Inicio rápido (con Docker)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-organizacion/sgip-cap.git
cd sgip-cap

# 2. Iniciar todos los servicios
docker-compose up -d

# 3. Inicializar datos del sector Moche
docker-compose exec backend python -m app.scripts.init_moche

# 4. Generar datos de prueba (opcional)
docker-compose exec backend python -m app.scripts.generate_moche_data
```

La aplicación estará disponible en:
- **Backend API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Frontend**: http://localhost:5173
- **WebSocket**: `ws://localhost:8000/ws/{client_id}`

---

## Inicio rápido (sin Docker)

### Backend

```bash
cd apps/backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno (opcional)
# Crear archivo .env con las variables deseadas (ver configuración)

# Inicializar datos
python -m app.scripts.init_moche

# Generar datos de prueba (opcional)
python -m app.scripts.generate_moche_data

# Ejecutar servidor de desarrollo
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

---

## API Endpoints

| Grupo          | Prefijo                | Principales endpoints                          |
|----------------|------------------------|------------------------------------------------|
| **Telemetría** | `/api/telemetry`       | `latest`, `history/{dma}`, `summary/{dma}`, `trends/{dma}` |
| **Anomalías**  | `/api/anomalies`       | `analyze`, `dma/{dma}`, `recent`, `stats`      |
| **Incidentes** | `/api/incidents`       | CRUD completo, SLA metrics                     |
| **KPIs**       | `/api/kpis`            | `executive`, `dma/{dma}`, `water-loss`, `sla-compliance` |
| **DMAs**       | `/api/dmas`            | Listado, detalle, sensores, resumen, KPIs      |
| **Alertas**    | `/api/alerts`          | Listado, acknowledge, resolve, history         |
| **Reportes**   | `/api/reports`         | `daily`, `weekly`, `custom`, `export`          |

Documentación interactiva completa en `/docs` y `/redoc`.

---

## Configuración por entorno

| Variable                     | Default                                         | Descripción                          |
|------------------------------|-------------------------------------------------|--------------------------------------|
| `DATABASE_URL`               | `postgresql://sgip_user:sgip_pass@localhost:5432/sgip_cap` | Conexión PostgreSQL |
| `REDIS_URL`                  | `redis://localhost:6379`                        | Conexión Redis                       |
| `SECRET_KEY`                 | `your-secret-key-here-change-in-production`     | Clave JWT                            |
| `DATA_PROVIDER`              | `mock`                                          | Fuente: `mock`, `csv` o `scada`      |
| `ANOMALY_THRESHOLD`          | `0.75`                                          | Umbral de detección (ML)             |
| `TRAINING_WINDOW_DAYS`       | `30`                                            | Ventana de entrenamiento ML          |
| `TARGET_DMA`                 | `DMA-MO-01`                                     | DMA objetivo (Moche)                 |

Se puede configurar via archivo `.env`, variables de entorno o `docker-compose.yml`.

---

## Ciclo de vida de incidentes (ITIL)

```
NEW ──▶ CLASSIFIED ──▶ ASSIGNED ──▶ IN_PROGRESS ──▶ RESOLVED ──▶ CLOSED
                         │                                │
                         └──▶ CANCELLED                    └──▶ REOPENED ──▶ ...
```

- **SLA**: Cada prioridad tiene un tiempo máximo de respuesta y resolución.
- **Prioridades**: LOW, MEDIUM, HIGH, CRITICAL.
- **Escalamiento**: Automático según criticidad y tiempo transcurrido.

---

## Detección de anomalías (ML)

El sistema utiliza **Isolation Forest** (scikit-learn) para detectar anomalías en lecturas de presión y caudal:

1. **Feature engineering**: presión, caudal, hora del día, día de semana, medias móviles, desviaciones estándar.
2. **Entrenamiento automático**: Se entrena con datos históricos al iniciar; si no hay datos, genera una línea base sintética.
3. **Severidad**: Calculada en base a la magnitud de la desviación (LOW / MEDIUM / HIGH / CRITICAL).
4. **Estimación de pérdidas**: Volumen de agua perdido estimado según la variación de presión y caudal.

---

## Fuentes de datos

| Provider    | Descripción                                      | Configuración              |
|-------------|--------------------------------------------------|----------------------------|
| `mock`      | Genera datos sintéticos con fugas simuladas      | `DATA_PROVIDER=mock`       |
| `csv`       | Lee archivos CSV con columnas estándar           | `DATA_PROVIDER=csv`        |
| `scada`     | Lee exportaciones SCADA de SEDALIB (mapeo columnas)| `DATA_PROVIDER=scada`    |

---

## Pruebas

```bash
cd apps/backend
pytest -v
```

---

## Roadmap

- [x] MVP funcional — Monitoreo del sector Moche
- [x] Detección de anomalías con ML (Isolation Forest)
- [x] Gestión de incidentes ITIL (SLA, prioridades, ciclo de vida)
- [x] Reportes diarios, semanales y personalizados
- [x] WebSockets en tiempo real
- [x] Dashboard Ejecutivo con KPIs
- [x] Frontend React completo (6 vistas profesionales + Login + Reportes)
- [x] Autenticación JWT + Login UI en frontend
- [x] Migraciones Alembic iniciales
- [x] WebSocket funcional (reconexión automática, tiempo real)
- [ ] Múltiples DMAs (actualmente enfocado en DMA-MO-01)
- [ ] Integración SCADA en tiempo real
- [ ] Página de Reportes con exportación
- [ ] Notificaciones push / email
- [ ] Pruebas E2E

---

## Licencia

Este proyecto es propiedad de **SEDALIB S.A.** — Todos los derechos reservados.
