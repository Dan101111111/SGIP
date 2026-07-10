import { useLocation } from 'react-router-dom';
import { Bell, AlertCircle } from 'lucide-react';
import { useAlerts, useAcknowledgeAlert } from '../services/hooks';
import { useAuth } from '../services/auth';
import { useState } from 'react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard Ejecutivo',
  '/monitoring': 'Monitoreo Hidráulico',
  '/dmas': 'Mapa de DMAs',
  '/incidents': 'Incidencias ITIL',
  '/analytics': 'Analítica IA',
  '/settings': 'Configuración',
};

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: alerts } = useAlerts();
  const acknowledge = useAcknowledgeAlert();
  const [showAlerts, setShowAlerts] = useState(false);

  const title = pageTitles[location.pathname] || 'SGIP-CAP';
  const criticalAlerts = alerts?.filter((a) => !a.acknowledged) ?? [];
  const criticalCount = criticalAlerts.filter((a) => a.severity === 'CRITICAL').length;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 z-40">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500">Sistema de Gestión Integral de Pérdidas</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {criticalCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {criticalCount}
              </span>
            )}
          </button>
          {showAlerts && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700">
                Alertas ({alerts?.length ?? 0})
              </div>
              {(!alerts || alerts.length === 0) && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No hay alertas</div>
              )}
              {alerts?.map((alert) => (
                <div key={alert.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50">
                  <div className="flex items-start gap-2">
                    <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                      alert.severity === 'CRITICAL' ? 'text-red-500' :
                      alert.severity === 'HIGH' ? 'text-orange-500' : 'text-yellow-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{alert.dma_name}</p>
                      <p className="text-xs text-gray-500 truncate">{alert.message}</p>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledge.mutate(alert.id)}
                        className="text-xs text-hydraulic-600 hover:text-hydraulic-800 font-medium shrink-0"
                      >
                        OK
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 block leading-tight">{user?.username || 'Admin'}</span>
            <span className="text-xs text-gray-400">{user?.role || 'operator'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
