import { useState } from 'react';
import { useIncidents, useUpdateIncidentStatus } from '../../services/hooks';
import StatusBadge, { PriorityBadge } from '../../components/StatusBadge';
import { format } from '../../utils/format';
import { Search, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const statusFilters = ['TODOS', 'NEW', 'CLASSIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const priorityFilters = ['TODOS', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const translateStatus = (s: string) => {
  const map: Record<string, string> = { TODOS: 'Todos', NEW: 'Nuevo', CLASSIFIED: 'Clasificado', ASSIGNED: 'Asignado', IN_PROGRESS: 'En Progreso', RESOLVED: 'Resuelto', CLOSED: 'Cerrado' };
  return map[s] || s;
};

const translatePriority = (p: string) => {
  const map: Record<string, string> = { TODOS: 'Todos', CRITICAL: 'Crítico', HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' };
  return map[p] || p;
};

export default function IncidentsPage() {
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [priorityFilter, setPriorityFilter] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: incidents, isLoading } = useIncidents();
  const updateStatus = useUpdateIncidentStatus();

  const list = Array.isArray(incidents) ? incidents : [];
  const filtered = list.filter((inc) => {
    if (statusFilter !== 'TODOS' && inc.status !== statusFilter) return false;
    if (priorityFilter !== 'TODOS' && inc.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!inc.code.toLowerCase().includes(q) && !inc.title.toLowerCase().includes(q) && !(inc.dma_name || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeCount = list.filter((i) => !['RESOLVED', 'CLOSED'].includes(i.status)).length;
  const slaAtRisk = list.filter((i) => i.sla_due_at && new Date(i.sla_due_at) > new Date() && !['RESOLVED', 'CLOSED'].includes(i.status)).length;

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900">{list.length}</p></div>
        <div className="kpi-card"><p className="text-xs text-gray-500">Activos</p><p className="text-2xl font-bold text-orange-600">{activeCount}</p></div>
        <div className="kpi-card"><p className="text-xs text-gray-500">SLA en Riesgo</p><p className={clsx('text-2xl font-bold', slaAtRisk > 0 ? 'text-red-600' : 'text-green-600')}>{slaAtRisk}</p></div>
        <div className="kpi-card"><p className="text-xs text-gray-500">Resueltos</p><p className="text-2xl font-bold text-green-600">{list.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length}</p></div>
      </div>

      <div className="kpi-card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar por código, título o DMA..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex gap-2">
            {priorityFilters.map((p) => (
              <button key={p} onClick={() => setPriorityFilter(p)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  priorityFilter === p ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {translatePriority(p)}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {statusFilters.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {translateStatus(s)}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No se encontraron incidentes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Código</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Título</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">DMA</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Prioridad</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Estado</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Asignado</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">SLA</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Creado</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inc) => {
                  const slaDate = inc.sla_due_at ? new Date(inc.sla_due_at) : null;
                  const slaExpired = slaDate && slaDate < new Date() && !['RESOLVED', 'CLOSED'].includes(inc.status);
                  return (
                    <tr key={inc.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-mono text-xs text-gray-700">{inc.code}</td>
                      <td className="py-3 px-3 font-medium text-gray-800">{inc.title}</td>
                      <td className="py-3 px-3 text-gray-600">{inc.dma_name || inc.dma_id}</td>
                      <td className="py-3 px-3"><PriorityBadge priority={inc.priority} /></td>
                      <td className="py-3 px-3"><StatusBadge status={inc.status} /></td>
                      <td className="py-3 px-3 text-gray-600">{inc.assigned_to || '--'}</td>
                      <td className="py-3 px-3">
                        <span className={clsx('flex items-center gap-1 text-xs', slaExpired ? 'text-red-600 font-medium' : 'text-gray-500')}>
                          <Clock className="w-3 h-3" />{slaDate ? format.datetime(inc.sla_due_at) : '--'}{slaExpired && ' ⚠️'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-500">{format.datetime(inc.created_at)}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          {inc.status === 'NEW' && (
                            <button onClick={() => updateStatus.mutate({ id: inc.id, status: 'CLASSIFIED' })}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600" title="Clasificar"><CheckCircle className="w-4 h-4" /></button>
                          )}
                          {(inc.status === 'IN_PROGRESS' || inc.status === 'ASSIGNED') && (
                            <button onClick={() => updateStatus.mutate({ id: inc.id, status: 'RESOLVED' })}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-green-600" title="Resolver"><CheckCircle className="w-4 h-4" /></button>
                          )}
                          {!['RESOLVED', 'CLOSED', 'CANCELLED'].includes(inc.status) && (
                            <button onClick={() => updateStatus.mutate({ id: inc.id, status: 'CANCELLED' })}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600" title="Cancelar"><XCircle className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
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
