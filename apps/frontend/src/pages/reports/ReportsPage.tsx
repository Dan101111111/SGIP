import { useState } from 'react';
import { useDailyReport, useWeeklyReport } from '../../services/hooks';
import { format } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';
import clsx from 'clsx';

type Tab = 'daily' | 'weekly' | 'custom';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('daily');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { data: daily, isLoading: dailyLoading } = useDailyReport(date);
  const { data: weekly, isLoading: weeklyLoading } = useWeeklyReport();
  const isLoading = (tab === 'daily' && dailyLoading) || (tab === 'weekly' && weeklyLoading);

  const dailyChart = daily?.readings?.length
    ? daily.readings.slice(-24).map((r: any) => ({
        time: new Date(r.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        presion: r.pressure_mca,
        caudal: r.flow_lps,
      }))
    : [];

  const weeklyChart = weekly?.daily_stats?.length
    ? weekly.daily_stats.map((d: any) => ({
        dia: new Date(d.date).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' }),
        presion: d.avg_pressure,
        caudal: d.avg_flow,
      }))
    : [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'daily', label: 'Reporte Diario' },
    { key: 'weekly', label: 'Reporte Semanal' },
    { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.key ? 'bg-primary-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}>{t.label}</button>
        ))}
      </div>

      {tab === 'daily' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>

          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div> : daily ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="kpi-card">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Resumen del Día</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Presión Promedio</p><p className="text-xl font-bold text-gray-900">{daily.summary?.avg_pressure ?? '--'} <span className="text-sm font-normal text-gray-400">MCA</span></p></div>
                  <div><p className="text-xs text-gray-500">Caudal Promedio</p><p className="text-xl font-bold text-gray-900">{daily.summary?.avg_flow ?? '--'} <span className="text-sm font-normal text-gray-400">LPS</span></p></div>
                  <div><p className="text-xs text-gray-500">Anomalías</p><p className="text-xl font-bold text-orange-600">{daily.anomalies?.total ?? 0}</p></div>
                  <div><p className="text-xs text-gray-500">Incidentes</p><p className="text-xl font-bold text-gray-900">{daily.incidents?.total ?? 0}</p></div>
                </div>
              </div>
              <div className="kpi-card">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Tendencia del Día</h3>
                {dailyChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={dailyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" fontSize={10} tickLine={false} />
                      <YAxis fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="presion" stroke="#0d6ebd" strokeWidth={2} dot={false} name="Presión (MCA)" />
                      <Line type="monotone" dataKey="caudal" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Caudal (LPS)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-8 text-center">Sin datos para esta fecha</p>}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {tab === 'weekly' && (
        <div className="space-y-6">
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div> : weekly ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="kpi-card">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Resumen Semanal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Total Lecturas</p><p className="text-xl font-bold text-gray-900">{weekly.total_readings ?? 0}</p></div>
                  <div><p className="text-xs text-gray-500">Anomalías</p><p className="text-xl font-bold text-orange-600">{weekly.total_anomalies ?? 0}</p></div>
                  <div><p className="text-xs text-gray-500">Incidentes</p><p className="text-xl font-bold text-gray-900">{weekly.total_incidents ?? 0}</p></div>
                  <div><p className="text-xs text-gray-500">Pérdida Estimada</p><p className="text-xl font-bold text-blue-600">{weekly.water_loss_estimate ?? '--'} m³</p></div>
                </div>
              </div>
              <div className="kpi-card">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Promedios Diarios</h3>
                {weeklyChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="dia" fontSize={10} tickLine={false} />
                      <YAxis fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="presion" fill="#0d6ebd" radius={[3, 3, 0, 0]} name="Presión (MCA)" />
                      <Bar dataKey="caudal" fill="#0ea5e9" radius={[3, 3, 0, 0]} name="Caudal (LPS)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-8 text-center">Sin datos semanales</p>}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {tab === 'custom' && (
        <div className="kpi-card">
          <div className="flex flex-col items-center py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Reporte Personalizado</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md">
              Selecciona un rango de fechas y DMAs para generar un reporte a medida con estadísticas detalladas, gráficos y exportación a CSV.
            </p>
            <div className="flex gap-4 items-center">
              <div><label className="block text-xs text-gray-500 mb-1">Desde</label><input type="date" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Hasta</label><input type="date" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 flex items-center gap-2 mt-5">
                <Download className="w-4 h-4" /> Generar
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && (tab === 'daily' && daily || tab === 'weekly' && weekly) && (
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      )}
    </div>
  );
}
