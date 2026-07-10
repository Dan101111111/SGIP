# Guía de Implementación Definitiva — SGIP-CAP

## Objetivo
Configurar el SGIP-CAP para operar **sin mocks**, **sin datos simulados**, con **WebSocket funcional** y fuentes de datos reales de SEDALIB.

---

## 1. Infraestructura Base

### 1.1 Requisitos de hardware

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16 GB |
| Disco | 50 GB SSD | 100 GB+ SSD |
| Red | 100 Mbps | 1 Gbps |

### 1.2 Servicios permanentes

| Servicio | Versión | Propósito |
|----------|---------|-----------|
| PostgreSQL | 15+ | Base de datos transaccional |
| Redis | 7+ | Cache, pub/sub, cola de tareas |
| Docker | 24+ | Contenedorización |
| Nginx / Traefik | Última stable | Reverse proxy, SSL, routing |

---

## 2. Fuente de Datos Reales (reemplazar MockProvider)

### 2.1 Opción A — Exportaciones SCADA (CSV)

SEDALIB entrega archivos CSV con columnas como:

```csv
timestamp,sensor_id,presion_mca,caudal_lps,calidad
2026-07-10 00:00:00,SENS-MO-01-P,52.3,24.1,GOOD
2026-07-10 00:15:00,SENS-MO-01-P,51.8,24.5,GOOD
```

**Configurar:**

```env
DATA_PROVIDER=csv
CSV_DATA_PATH=data/sedalib_imports/scada_export.csv
```

**Requisitos del CSV:**
- Frecuencia de muestreo: cada 15 minutos (mínimo)
- Ventana mínima: 90 días continuos de histórico
- Columnas requeridas: `timestamp`, `pressure_mca`, `flow_lps`, `sensor_id`, `quality_flag`
- Opcional: `dma_id`, `temperature`

**Procesamiento:**
- El `CsvDataProvider` ya implementa lectura y normalización (ver `apps/backend/app/providers/csv_provider.py`)
- Si el formato difiere, crear un nuevo `SedalibCsvProvider` que extienda `BaseProvider`

### 2.2 Opción B — API SCADA (tiempo real)

Si SEDALIB expone una API REST/SCADA:

```env
DATA_PROVIDER=scada_api
SCADA_API_URL=https://scada.sedalib.gob.pe/api/v1/telemetry
SCADA_API_KEY=...
SCADA_POLL_INTERVAL=60
```

**Implementar:**
- Crear `providers/scada_api_provider.py` que implemente `BaseProvider`
- Usar `httpx.AsyncClient` con pooling de conexiones
- Cachear respuestas en Redis con TTL de 60s

### 2.3 Opción C — Ingesta por Webhook

SEDALIB envía datos a un endpoint del SGIP-CAP:

```
POST /api/ingest/telemetry
Body: { "timestamp": "...", "dma_id": "...", "pressure_mca": 52.3, "flow_lps": 24.1 }
```

**Implementar:**
- Crear `routes_ingest.py` con endpoint `POST /api/ingest/telemetry`
- Validar HMAC o API key en header
- Publicar evento en Redis Pub/Sub para notificar a WebSocket

---

## 3. WebSocket — Tiempo Real

### 3.1 Estado actual

El backend ya tiene:
- `websocket/connection_manager.py` — pool de conexiones
- `websocket/websocket_handler.py` — streaming en tiempo real

### 3.2 Conexión desde frontend

El frontend (`MonitoringPage.tsx`) ya conecta a:

```
ws://localhost:8000/ws/monitor
```

Cuando el servidor envía nuevos datos (provenientes de SCADA real o mock), el WebSocket las empuja al frontend.

### 3.3 Flujo de datos real

Con `DATA_PROVIDER=mock`:
1. `MockProvider` genera lecturas sintéticas cada 60s
2. `TelemetryService.get_latest_readings()` las retorna
3. WebSocket las difunde cada 15s a los clientes conectados

Con datos reales:
1. SCADA API/CSV/cron envía lecturas a PostgreSQL
2. Un **cron job interno** (o trigger de base de datos) detecta nueva lectura
3. `WebSocketHandler.broadcast()` la envía a todos los clientes
4. El frontend actualiza la UI sin polling

### 3.4 Para habilitar WebSocket con datos reales

**Paso 1**: Crear un publicador de eventos en `services/event_service.py`:

```python
class EventService:
    def __init__(self):
        self.redis = redis.from_url(settings.redis_url)
        self.pubsub = self.redis.pubsub()
    
    async def publish_reading(self, reading: TelemetryReading):
        await self.redis.publish("telemetry:new", reading.json())
        # Broadcast a WebSocket clients
        from app.websocket.connection_manager import manager
        await manager.broadcast(reading.dict())
```

**Paso 2**: Modificar `telemetry_service.py` para publicar eventos al guardar lecturas.

**Paso 3**: Verificar conexión:

```bash
# Cliente de prueba WebSocket
curl -H "Connection: Upgrade" -H "Upgrade: websocket" ws://localhost:8000/ws/monitor
```

---

## 4. Motor ML — Sin Datos Mock

### 4.1 Estado actual

El `isolation_forest_model.py` se entrena con datos sintéticos si no hay datos reales.

### 4.2 Para usar datos reales

Con 90+ días de histórico:

1. El modelo se entrena automáticamente al iniciar el servidor
2. Usa las últimas `TRAINING_WINDOW_DAYS=30` lecturas reales
3. Feature engineering extrae: presión, caudal, hora, día, medias móviles, desviación estándar

**Configurar:**

```env
ANOMALY_THRESHOLD=0.75
TRAINING_WINDOW_DAYS=45
```

**Re-entrenamiento periódico:**
- Agregar scheduler con `APScheduler` o Celery Beat
- Re-entrenar cada 24h con datos nuevos
- Versionar modelos en `ml/model_registry.py`

---

## 5. Correcciones Técnicas Pendientes

### 5.1 Autenticación

- [ ] Reemplazar default credentials por tabla `users` en PostgreSQL
- [ ] Agregar `POST /api/auth/register`
- [ ] Hash de contraseñas con `pbkdf2_sha256` (ya corregido)
- [ ] Endpoints protegidos con `Depends(get_current_user)`

### 5.2 Base de datos

- [ ] Ejecutar migración Alembic: `alembic upgrade head`
- [ ] Agregar tabla `users`:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'operator',
    created_at TIMESTAMP DEFAULT NOW()
);
```
- [ ] Agregar tabla `sla_policies` para configuración de SLA por prioridad
- [ ] Agregar tabla `audit_logs` para trazabilidad

### 5.3 WebSocket — Producción

- [ ] Usar Redis Pub/Sub en vez de broadcasts in-process
- [ ] Agregar autenticación WebSocket (JWT en query param)
- [ ] Heartbeat cada 30s para detectar conexiones muertas
- [ ] Reconexión automática con backoff exponencial en frontend

---

## 6. Variables de Entorno — Configuración Final

```env
# Producción
DATABASE_URL=postgresql://sgip_user:sgip_pass@postgres:5432/sgip_cap
REDIS_URL=redis://redis:6379
SECRET_KEY=<generar con: openssl rand -hex 32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATA_PROVIDER=csv
CSV_DATA_PATH=data/sedalib_imports/scada_export.csv
ANOMALY_THRESHOLD=0.75
TRAINING_WINDOW_DAYS=45
TARGET_DMA=DMA-MO-01
TARGET_DMA_NAME=Moche 01
LOG_LEVEL=INFO
ALLOWED_ORIGINS=["https://sgip.sedalib.gob.pe"]
```

---

## 7. Checklist para Producción

### Semana 1 — Datos
- [ ] Obtener exportación CSV histórica de SEDALIB (mínimo 90 días)
- [ ] Validar formato y normalizar columnas
- [ ] Ubicar CSV en `data/sedalib_imports/`
- [ ] Configurar `DATA_PROVIDER=csv`

### Semana 2 — ML
- [ ] Alimentar el modelo con datos reales
- [ ] Ajustar umbral de detección (`ANOMALY_THRESHOLD`)
- [ ] Validar tasa de falsos positivos
- [ ] Re-entrenar después de 7 días de datos nuevos

### Semana 3 — Tiempo Real
- [ ] Si hay API SCADA: configurar polling cada 60s
- [ ] Si no: habilitar webhook de ingesta
- [ ] Probar WebSocket con datos reales
- [ ] Verificar latencia < 2s entre lectura y frontend

### Semana 4 — Producción
- [ ] SSL/TLS en Nginx
- [ ] Autenticación fuerte (LDAP / SSO)
- [ ] Monitoreo con Prometheus + Grafana
- [ ] Backup automático de PostgreSQL
- [ ] Health checks en Docker Compose
- [ ] Pruebas de carga: 1000 requests/min simultáneos

---

## 8. Resumen de Cambios Necesarios

| Componente | Cambio | Prioridad |
|------------|--------|-----------|
| `DATA_PROVIDER` | De `mock` a `csv` o `scada_api` | 🔴 Alta |
| `providers/csv_provider.py` | Validar columnas del CSV real | 🔴 Alta |
| `ml/isolation_forest_model.py` | Entrenar con datos reales | 🔴 Alta |
| WebSocket | Integrar con Redis Pub/Sub | 🟡 Media |
| `routes_auth.py` | Reemplazar hash por bcrypt funcional | ✅ Hecho |
| `security.py` | Cambiado a pbkdf2_sha256 | ✅ Hecho |
| frontend/WebSocket | Reconexión automática | 🟡 Media |
| `docker-compose.yml` | Agregar healthchecks | 🟢 Baja |
| Alembic | Migraciones ejecutadas | 🟢 Baja |
