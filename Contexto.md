El SGIP-CAP es una aplicación web empresarial orientada a la detección temprana y gestión de posibles fugas de agua potable mediante el análisis inteligente de variables hidráulicas como presión y caudal. El sistema opera bajo una arquitectura de monolito modular, con frontend en React + TypeScript, backend en FastAPI, base de datos PostgreSQL, motor de IA basado en Isolation Forest y una capa de proveedores de datos que permite trabajar inicialmente con datos simulados o CSV, y posteriormente con exportaciones reales de SEDALIB si estas son proporcionadas.
El sistema simula la recepción de datos tipo SCADA, los normaliza, los almacena y los analiza mediante un modelo de detección de anomalías. Cuando se identifica un comportamiento compatible con una fuga, el sistema genera una alerta crítica y crea automáticamente un ticket de incidencia bajo un enfoque ITIL 4, permitiendo su clasificación, priorización, seguimiento por SLA y cierre operativo. Además, ofrece una interfaz profesional con dashboard ejecutivo, monitoreo hidráulico, mapa de DMAs, gestión de incidencias, detalle de sectores y analítica del modelo de IA.
El SGIP-CAP no requiere sensores físicos ni acceso directo al SCADA para su MVP. Su diseño desacoplado permite validar la viabilidad técnica del servicio con datos mock y mantener la posibilidad de integrar datos reales en una etapa posterior. De esta manera, el sistema demuestra cómo una solución basada en IA, análisis hidráulico y gestión de servicios puede contribuir a reducir el Agua No Facturada y fortalecer la transformación digital de SEDALIB.

Nuestro objetivo no es acceder al SCADA, sino validar el SGIP-CAP con información histórica anonimizada. Si fuera posible, agradeceríamos que nos proporcionen exportaciones en formato CSV de variables como presión y caudal, junto con un historial de incidencias y una descripción general de los sectores monitoreados. Con esa información podemos desarrollar y evaluar el prototipo sin interactuar directamente con los sistemas críticos de SEDALIB. 

Información requerida para el desarrollo del MVP SGIP-CAP
Datos operacionales
Series históricas de presión.
Series históricas de caudal.
Frecuencia de muestreo (cada cuánto se registran los datos).
Identificador de cada punto de medición.
Información hidráulica
Nombre de los sectores o DMAs.
Ubicación aproximada de sensores.
Esquema simplificado de la red.
Información de incidencias
Historial de fugas.
Fecha y hora.
Ubicación.
Tipo de fuga.
Tiempo de reparación.
Información operativa
Procedimiento actual cuando ocurre una fuga.
Quién recibe el aviso.
Quién genera la orden de trabajo.
Tiempo promedio de atención.

1. Arquitectura general recomendada
Stack propuesto
Para 2 semanas y 5 programadores, recomiendo:
SGIP-CAP MVP

Frontend:
React + Vite + TypeScript
Tailwind CSS
shadcn/ui o Material UI
TanStack Query
Plotly.js / Apache ECharts
Leaflet o Mapbox GL para mapa de DMAs

Backend:
FastAPI
Pydantic
SQLAlchemy
PostgreSQL
Alembic
WebSockets o Server-Sent Events
scikit-learn

IA:
Isolation Forest
Feature Engineering hidráulico
Detección de anomalías por presión y caudal

Datos:
MockDataProvider
CsvDataProvider
ScadaExportProvider futuro

Infraestructura:
Docker Compose
PostgreSQL
Backend API
Frontend


No recomiendo microservicios reales para 2 semanas. Sería demasiado costoso. Lo correcto es un modular monolith: internamente separado por módulos como si fueran microservicios, pero desplegado como un solo backend. Eso les da orden, escalabilidad y velocidad.


2. Organización de módulos
Usaría un monorepo así:
sgip-cap/
│
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── pages/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── monitoring/
│   │   │   │   ├── dmas/
│   │   │   │   ├── incidents/
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── telemetry/
│   │   │   │   ├── anomalies/
│   │   │   │   ├── incidents/
│   │   │   │   └── kpis/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   └── layouts/
│   │   └── package.json
│   │
│   └── backend/
│       ├── app/
│       │   ├── main.py
│       │   ├── api/
│       │   │   ├── routes_telemetry.py
│       │   │   ├── routes_anomalies.py
│       │   │   ├── routes_incidents.py
│       │   │   ├── routes_kpis.py
│       │   │   └── routes_dmas.py
│       │   ├── core/
│       │   │   ├── config.py
│       │   │   ├── security.py
│       │   │   └── exceptions.py
│       │   ├── domain/
│       │   │   ├── dma.py
│       │   │   ├── sensor.py
│       │   │   ├── telemetry.py
│       │   │   ├── anomaly.py
│       │   │   └── incident.py
│       │   ├── services/
│       │   │   ├── telemetry_service.py
│       │   │   ├── anomaly_service.py
│       │   │   ├── incident_service.py
│       │   │   ├── kpi_service.py
│       │   │   └── notification_service.py
│       │   ├── providers/
│       │   │   ├── base_provider.py
│       │   │   ├── mock_provider.py
│       │   │   ├── csv_provider.py
│       │   │   └── scada_export_provider.py 
│       │   ├── ml/
│       │   │   ├── feature_engineering.py
│       │   │   ├── isolation_forest_model.py
│       │   │   └── model_registry.py
│       │   ├── simulation/
│       │   │   ├── hydraulic_simulator.py
│       │   │   └── scenario_generator.py
│       │   ├── infrastructure/
│       │   │   ├── database.py
│       │   │   ├── repositories.py
│       │   │   └── models.py
│       │   └── schemas/
│       │       ├── telemetry_schema.py
│       │       ├── incident_schema.py
│       │       └── kpi_schema.py
│       ├── alembic/
│       └── requirements.txt
│
├── data/
│   ├── mock/
│   ├── samples/
│   └── sedalib_imports/
│
├── docs/
│   ├── architecture.md
│   ├── api-contract.md
│   ├── itil-flow.md
│   └── demo-script.md
│
├── docker-compose.yml
└── README.md

Esta estructura permite que cada integrante trabaje en un módulo sin tocar el código del otro.

3. Estrategia para datos mock ahora y datos reales después
La parte más importante es esta: el frontend y la IA nunca deben depender directamente del formato original de los datos.
Deben depender de un modelo canónico, es decir, un formato interno estándar.
Modelo canónico de telemetría
class TelemetryReading(BaseModel):
    timestamp: datetime
    dma_id: str
    dma_name: str
    sensor_id: str
    pressure_mca: float
    flow_lps: float
    source: str
    quality_flag: str

Con esto, no importa si los datos vienen de:
Mock
CSV
SCADA exportado
Excel
API futura
Base de datos real

Todo se transforma al mismo formato interno.

Patrón recomendado: Provider / Adapter
from abc import ABC, abstractmethod
from typing import list
from app.domain.telemetry import TelemetryReading


class TelemetryProvider(ABC):

    @abstractmethod
    def get_latest_readings(self) -> list[TelemetryReading]:
        pass

    @abstractmethod
    def get_historical_readings(
        self,
        dma_id: str,
        start_date: str,
        end_date: str
    ) -> list[TelemetryReading]:
        pass

Luego crean implementaciones diferentes:
MockTelemetryProvider
CsvTelemetryProvider
ScadaExportProvider

Ejemplo:
class MockTelemetryProvider(TelemetryProvider):
    def get_latest_readings(self):
        return generate_mock_hydraulic_readings()


class CsvTelemetryProvider(TelemetryProvider):
    def get_latest_readings(self):
        return read_and_normalize_csv("data/sedalib_imports/scada_export.csv")

Y en el archivo .env:
DATA_PROVIDER=mock

Después, si SEDALIB entrega datos:
DATA_PROVIDER=csv

No se toca el frontend.
No se toca el modelo IA.
No se toca la lógica ITIL.
Solo cambia el adaptador de datos.

4. Datos mock que deben crear desde el día 1
No generen datos al azar sin control. Creen escenarios hidráulicos realistas.
DMAs simulados
DMA-EP-01  El Porvenir 01
DMA-EP-02  El Porvenir 02
DMA-MO-01  Moche 01
DMA-VL-01  Víctor Larco 01
DMA-LE-01  La Esperanza 01

El documento menciona que SEDALIB opera en distritos como Moche, La Esperanza, Huanchaco, Salaverry, El Porvenir y otras zonas de La Libertad, así que estos sectores simulados son coherentes con el contexto operativo del proyecto.
Escenarios
normal_day.csv
leak_event_el_porvenir.csv
night_flow_anomaly.csv
pressure_drop_moche.csv
sensor_noise.csv
false_positive_event.csv

Variables mínimas
timestamp
dma_id
sensor_id
pressure_mca
flow_lps
temperature
status

Comportamiento esperado
Escenario normal:
Presión estable, caudal estable.

Escenario fuga:
Presión cae progresivamente.
Caudal sube de forma anómala.
El modelo detecta anomalía.
El sistema genera ticket ITIL.
El dashboard muestra alerta crítica.

Escenario falso positivo:
Ruido temporal.
El sistema marca sospecha, pero no genera ticket crítico inmediato.

Esto les permitirá hacer una demo potente aunque SEDALIB nunca entregue datos reales.

5. Backend robusto
El backend debe ser el centro del sistema. Nada de lógica importante en el frontend.
Módulos del backend
TelemetryService
Responsable de recibir, normalizar y consultar datos hidráulicos.
get_latest_readings()
get_history_by_dma()
get_pressure_trend()
get_flow_trend()

AnomalyDetectionService
Responsable de preparar variables, ejecutar el modelo y devolver el resultado.
detect_anomaly(reading)
calculate_anomaly_score()
classify_severity()

IncidentManagementService
Responsable de convertir anomalías en tickets.
create_incident_from_anomaly()
assign_priority()
calculate_sla()
change_status()
close_incident()

KpiCalculationService
Responsable de métricas ejecutivas.
estimated_water_loss()
mean_detection_time()
active_incidents()
critical_dmas()
sla_compliance()


6. Base de datos recomendada
Usen PostgreSQL desde el inicio.
Tablas principales
dmas
sensors
telemetry_readings
anomalies
incident_tickets
sla_policies
users
audit_logs

Modelo mínimo
dmas
- id
- code
- name
- district
- latitude
- longitude
- status

sensors
- id
- code
- dma_id
- type
- unit
- status

telemetry_readings
- id
- timestamp
- dma_id
- sensor_id
- pressure_mca
- flow_lps
- source
- quality_flag

anomalies
- id
- telemetry_id
- dma_id
- anomaly_score
- severity
- detected_at
- status

incident_tickets
- id
- code
- anomaly_id
- dma_id
- title
- description
- priority
- status
- sla_due_at
- created_at
- resolved_at


7. Flujo técnico del sistema
1. El proveedor de datos entrega lecturas.
   Puede ser mock, CSV o SCADA exportado.

2. El backend normaliza los datos.

3. El sistema guarda la lectura en PostgreSQL.

4. El motor IA evalúa presión y caudal.

5. Si hay anomalía:
   - calcula severidad,
   - estima pérdida,
   - crea evento anómalo,
   - genera ticket ITIL.

6. El frontend recibe actualización en tiempo real.

7. El dashboard muestra:
   - alerta crítica,
   - DMA afectado,
   - caída de presión,
   - incremento de caudal,
   - ticket generado,
   - SLA de atención.

Ese flujo conecta directamente con el documento, porque el SGIP-CAP está planteado como un servicio TI para optimizar redes de distribución mediante IoT, Machine Learning, microservicios e ITIL 4, no simplemente como un tablero informativo.

8. Vistas profesionales del frontend
No hagan una sola pantalla. Hagan una aplicación con navegación lateral.
Layout
Sidebar izquierda
Header superior
Área principal dinámica
Cards ejecutivas
Paneles expandibles
Alertas globales

Vistas mínimas
1. Dashboard Ejecutivo
Para gerencia.
Debe mostrar:
ANF estimada evitada
DMAs monitoreados
Incidencias activas
Tiempo promedio de detección
SLA en riesgo
Última anomalía crítica

2. Monitoreo Hidráulico
Para operadores.
Debe mostrar:
Series temporales de presión
Series temporales de caudal
Estado por DMA
Lecturas en tiempo real
Eventos detectados

3. Mapa de DMAs
Para impacto visual.
Debe mostrar:
Mapa de Trujillo
Marcadores por DMA
Color según estado
Verde: normal
Amarillo: sospecha
Rojo: fuga detectada

4. Incidencias ITIL
Para gestión de servicios.
Debe mostrar:
Código de ticket
DMA afectado
Prioridad
Estado
SLA
Fecha de detección
Responsable

Estados sugeridos:
Nuevo
Clasificado
Asignado
En atención
Resuelto
Cerrado

5. Detalle de DMA
Vista técnica.
Debe mostrar:
Presión histórica
Caudal histórico
Anomalías recientes
Sensores asociados
Tickets del sector
Riesgo actual

6. Analítica IA
Para explicar al jurado.
Debe mostrar:
Modelo utilizado
Variables de entrada
Score de anomalía
Umbral de detección
Eventos detectados
Matriz simple de comportamiento


9. División del trabajo entre 5 programadores
Para que no se pisen, dividan por fronteras funcionales, no por archivos.
Programador 1 — Frontend Core + UX
Responsable de:
Layout general
Sidebar
Rutas
Tema visual
Componentes base
Login visual si lo incluyen
Diseño responsive

Carpetas:
apps/frontend/src/layouts
apps/frontend/src/components
apps/frontend/src/app


Programador 2 — Frontend DataViz + Mapa
Responsable de:
Gráficos de presión y caudal
Mapa de DMAs
Cards dinámicas
Alertas visuales
Actualización en tiempo real

Carpetas:
apps/frontend/src/features/telemetry
apps/frontend/src/features/dmas
apps/frontend/src/features/kpis


Programador 3 — Backend API + Base de Datos
Responsable de:
FastAPI
SQLAlchemy
PostgreSQL
Migraciones Alembic
Endpoints REST
Repositorios

Carpetas:
apps/backend/app/api
apps/backend/app/infrastructure
apps/backend/app/schemas


Programador 4 — IA + Simulador + Datos mock
Responsable de:
Generador hidráulico
Escenarios de fuga
Isolation Forest
Normalización de datos
Adaptadores mock/CSV

Carpetas:
apps/backend/app/ml
apps/backend/app/simulation
apps/backend/app/providers
data/mock


Programador 5 — Incidencias ITIL + Integración + QA
Responsable de:
Motor de tickets
Estados ITIL
SLA
KPIs de servicio
Pruebas funcionales
Docker Compose
Documentación técnica
Guion de demo

Carpetas:
apps/backend/app/services/incident_service.py
apps/backend/app/services/kpi_service.py
docs
docker-compose.yml


10. Regla para que nadie bloquee a nadie
Desde el día 1 deben definir el contrato API.
Ejemplo:
GET /api/dmas
GET /api/telemetry/latest
GET /api/telemetry/history?dma_id=DMA-EP-02
GET /api/anomalies
GET /api/incidents
POST /api/incidents/{id}/status
GET /api/kpis/executive

El frontend puede trabajar con respuestas mock aunque el backend todavía no esté completo.
Ejemplo de respuesta:
{
  "dma_id": "DMA-EP-02",
  "dma_name": "El Porvenir 02",
  "status": "CRITICAL",
  "pressure_mca": 24.8,
  "flow_lps": 38.2,
  "anomaly_score": 0.94,
  "last_update": "2026-07-07T10:30:00"
}

Así el equipo frontend no espera al backend, y el equipo backend no espera a IA.

11. Consideraciones para que no parezca “de script”
Diseño visual
Usen una identidad visual sobria:
Azul oscuro
Celeste hidráulico
Blanco
Gris claro
Rojo solo para alertas críticas

Eviten colores exagerados. Tiene que parecer sistema institucional.
Navegación
Debe sentirse como aplicación empresarial:
Dashboard
Monitoreo
Mapa
Incidencias
Analítica IA
Configuración

Componentes profesionales
Incluyan:
Sidebar fija
Breadcrumbs
Filtros por DMA
Filtros por fecha
Cards KPI
Tablas con búsqueda
Badges de estado
Modales de detalle
Alertas tipo toast
Skeleton loading
Estados vacíos

Visualizaciones complejas
Incluyan mínimo:
Gráfico de presión en tiempo real
Gráfico de caudal en tiempo real
Mapa con DMAs coloreados
Timeline de incidentes
Tabla de tickets ITIL
Gauge de riesgo hidráulico

Eso marcará distancia frente a un dashboard básico.

12. Decisión importante sobre IA
Aunque el documento menciona LSTM como visión futura, para 2 semanas usaría:
Isolation Forest

Justificación técnica:
- No requiere datos etiquetados.
- Funciona bien para anomalías.
- Se entrena con comportamiento normal.
- Es fácil de explicar.
- Es viable en 2 semanas.

Y en la documentación lo presentan así:
“El MVP utiliza Isolation Forest para validar la detección no supervisada de anomalías hidráulicas. La arquitectura permite reemplazar o complementar este modelo con LSTM en una fase posterior, conforme al roadmap del portafolio SGIP-CAP.”
Eso alinea el MVP con la visión del portafolio sin complicar innecesariamente la entrega.

13. Punto crítico a corregir en su documentación
Hay una posible inconsistencia: en la descripción del proyecto se menciona que SGIP-CAP está respaldado por el OE-6 de reducción del Agua No Facturada, pero en el listado estratégico previo del documento la reducción del ANF aparece asociada al OE7, mientras que OE6 se refiere a aguas residuales. Para evitar observaciones del jurado o de SEDALIB, conviene revisar y unificar esa numeración en todo el proyecto.

Arquitectura final recomendada
Mi recomendación definitiva:
Aplicación web empresarial
Frontend React + TypeScript
Backend FastAPI
PostgreSQL
Motor IA con Isolation Forest
Simulador hidráulico desacoplado
Capa Provider para datos mock / CSV / SCADA futuro
Gestión de incidencias ITIL
Visualización profesional por múltiples vistas
Docker Compose para despliegue local

La frase técnica que deberían defender es:
“SGIP-CAP fue diseñado con una arquitectura desacoplada por capas, donde la fuente de datos hidráulicos se abstrae mediante proveedores intercambiables. Esto permite operar inicialmente con datos simulados o mock y, posteriormente, integrar exportaciones reales de SCADA o datos históricos de SEDALIB sin modificar la lógica de negocio, el motor de IA ni las vistas de gestión ITIL.”
Esa arquitectura es viable para 2 semanas, suficientemente profesional para el jurado y coherente con el portafolio de servicios que ya definieron.

