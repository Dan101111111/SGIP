import { Settings, Database, Activity, Shield, Bell, Sliders } from 'lucide-react';

const configSections = [
  {
    title: 'Fuente de Datos',
    icon: Database,
    fields: [
      { label: 'DATA_PROVIDER', value: 'mock', desc: 'Proveedor activo de datos hidráulicos' },
      { label: 'CSV_DATA_PATH', value: 'data/sedalib_imports/scada_export.csv', desc: 'Ruta para importación CSV' },
    ],
  },
  {
    title: 'Detección de Anomalías',
    icon: Activity,
    fields: [
      { label: 'ANOMALY_THRESHOLD', value: '0.75', desc: 'Umbral mínimo para detectar anomalía' },
      { label: 'TRAINING_WINDOW_DAYS', value: '30', desc: 'Ventana de entrenamiento del modelo' },
    ],
  },
  {
    title: 'Sector',
    icon: Sliders,
    fields: [
      { label: 'TARGET_DMA', value: 'DMA-MO-01', desc: 'DMA objetivo del sistema' },
      { label: 'TARGET_DMA_NAME', value: 'Moche 01', desc: 'Nombre de visualización' },
    ],
  },
  {
    title: 'Base de Datos',
    icon: Database,
    fields: [
      { label: 'DATABASE_URL', value: 'postgresql://sgip_user:***@postgres:5432/sgip_cap', desc: 'Conexión PostgreSQL' },
      { label: 'REDIS_URL', value: 'redis://redis:6379', desc: 'Conexión Redis' },
    ],
  },
  {
    title: 'Seguridad',
    icon: Shield,
    fields: [
      { label: 'ALGORITHM', value: 'HS256', desc: 'Algoritmo JWT' },
      { label: 'ACCESS_TOKEN_EXPIRE_MINUTES', value: '30', desc: 'Expiración de token' },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="kpi-card">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-gray-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Configuración del Sistema</h3>
            <p className="text-sm text-gray-500">Variables de entorno y parámetros operativos</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {configSections.map((section) => (
            <div key={section.title} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <section.icon className="w-4 h-4 text-primary-500" />
                <h4 className="font-medium text-gray-700">{section.title}</h4>
              </div>
              <div className="space-y-3">
                {section.fields.map((field) => (
                  <div key={field.label}>
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-mono bg-gray-50 px-2 py-0.5 rounded text-gray-600">
                        {field.label}
                      </code>
                      <span className="text-xs font-mono text-gray-800 font-medium">{field.value}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{field.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
