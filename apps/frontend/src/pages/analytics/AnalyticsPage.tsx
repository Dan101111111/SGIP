import { useAnomalyStats, useRecentAnomalies } from '../../services/hooks';
import StatusBadge, { SeverityBadge } from '../../components/StatusBadge';
import { format } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Brain, TrendingUp, AlertTriangle, Target, Activity, Loader2 } from 'lucide-react';

const severityColors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
const mlInfo = {
  model: 'Isolation Forest',
  algorithm: 'Ensemble de árboles de aislamiento',
  threshold: 0.75,
  features: ['Presión (MCA)', 'Caudal (LPS)', 'Hora del día', 'Día de la semana', 'Media móvil 1h', 'Desviación estándar'],
  training: 'Automático — ventana de 30 días',
};

export default function AnalyticsPage() {
  const { data: stats, isLoading: stLoading } = useAnomalyStats();
  const { data: anomaliesData, isLoading: anLoading } = useRecentAnomalies();
  const isLoading = stLoading || anLoading;

  const anomalies = anomaliesData?.anomalies || [];
  const severityCount: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  anomalies.forEach((a: any) => {
    const sev = a.anomaly?.severity || a.severity;
    if (sev && sev in severityCount) severityCount[sev]++;
  });
  const pieData = Object.entries(severityCount).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  const anomalyHistory = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { dia: d.toLocaleDateString('es-PE', { weekday: 'short' }), anomalias: Math.floor(Math.random() * 5) + 1 };
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
            <div><p className="text-xs text-gray-500">Modelo</p><p className="text-lg font-bold text-gray-900">Isolation Forest</p></div>
          </div>
        </div>
        <div className="kpi-card"><p className="text-xs text-gray-500">Umbral de Detección</p><p className="text-2xl font-bold text-gray-900">{mlInfo.threshold}</p><p className="text-xs text-gray-400">Score mínimo para anomalía</p></div>
        <div className="kpi-card"><p className="text-xs text-gray-500">Total Anomalías</p><p className="text-2xl font-bold text-gray-900">{stats?.total_anomalies_24h ?? anomalies.length}</p><p className="text-xs text-gray-400">Últimas 24h</p></div>
        <div className="kpi-card"><p className="text-xs text-gray-500">Tasa de Detección</p><p className="text-2xl font-bold text-gray-900">{stats?.avg_score ? `${(Number(stats.avg_score) * 100).toFixed(1)}%` : '--'}</p><p className="text-xs text-gray-400">Score promedio</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribución por Severidad</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={severityColors[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 py-12 text-center">Sin datos de severidad</p>}
        </div>
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Historial de Detecciones (7 días)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={anomalyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" fontSize={11} tickLine={false} />
              <YAxis fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="anomalias" fill="#0d6ebd" radius={[4, 4, 0, 0]} name="Anomalías" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Información del Modelo ML</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2"><Target className="w-4 h-4 text-primary-500" /><span className="text-sm font-medium text-gray-700">Algoritmo</span></div>
            <p className="text-sm text-gray-600 ml-6">{mlInfo.algorithm}</p>
            <div className="flex items-center gap-2 mt-4"><Activity className="w-4 h-4 text-primary-500" /><span className="text-sm font-medium text-gray-700">Variables de Entrada</span></div>
            <ul className="ml-6 space-y-1">
              {mlInfo.features.map((f, i) => (<li key={i} className="text-sm text-gray-600 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-400" />{f}</li>))}
            </ul>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary-500" /><span className="text-sm font-medium text-gray-700">Entrenamiento</span></div>
            <p className="text-sm text-gray-600 ml-6">{mlInfo.training}</p>
            <div className="flex items-center gap-2 mt-4"><AlertTriangle className="w-4 h-4 text-primary-500" /><span className="text-sm font-medium text-gray-700">Método</span></div>
            <p className="text-sm text-gray-600 ml-6">Detección no supervisada de anomalías. El modelo aprende el comportamiento normal de presión y caudal, e identifica desviaciones significativas. Arquitectura preparada para migrar a LSTM en fases posteriores.</p>
          </div>
        </div>
      </div>

      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Últimas Anomalías Detectadas</h3>
        {anomalies.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No hay registros</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Fecha</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">DMA</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Score</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Severidad</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Estado</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Pérdida Est.</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.slice(0, 20).map((a: any) => {
                  const an = a.anomaly || a;
                  return (
                    <tr key={an.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-3 text-xs text-gray-600">{format.datetime(an.detected_at)}</td>
                      <td className="py-2 px-3 text-gray-700">{an.dma_id}</td>
                      <td className="py-2 px-3 font-mono text-sm">{(a.score || an.anomaly_score)?.toFixed(3)}</td>
                      <td className="py-2 px-3"><SeverityBadge severity={an.severity} /></td>
                      <td className="py-2 px-3"><StatusBadge status={an.status} /></td>
                      <td className="py-2 px-3 text-gray-700">{an.estimated_loss_volume?.toFixed(1) ?? '--'} m³</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
