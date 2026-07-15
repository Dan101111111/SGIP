import clsx from 'clsx';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusTranslations: Record<string, string> = {
  active: 'Activo',
  normal: 'Normal',
  resolved: 'Resuelto',
  closed: 'Cerrado',
  good: 'Bueno',
  new: 'Nuevo',
  classified: 'Clasificado',
  assigned: 'Asignado',
  in_progress: 'En Progreso',
  warning: 'Advertencia',
  suspicious: 'Sospechoso',
  medium: 'Medio',
  high: 'Alto',
  critical: 'Crítico',
  bad: 'Malo',
  anomaly: 'Anomalía',
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

const priorityTranslations: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const severityTranslations: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const normalMap: Record<string, string> = {
  active: 'status-badge-normal',
  normal: 'status-badge-normal',
  resolved: 'status-badge-normal',
  closed: 'status-badge-normal',
  good: 'status-badge-normal',
  new: 'status-badge-new',
  classified: 'status-badge-info',
  assigned: 'status-badge-info',
  in_progress: 'status-badge-warning',
  warning: 'status-badge-warning',
  suspicious: 'status-badge-warning',
  medium: 'status-badge-warning',
  high: 'status-badge-critical',
  critical: 'status-badge-critical',
  bad: 'status-badge-critical',
  anomaly: 'status-badge-critical',
  pending: 'status-badge-warning',
  confirmed: 'status-badge-normal',
  cancelled: 'status-badge-normal',
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status?.toLowerCase().replace(/\s+/g, '_') ?? '';
  const base = normalMap[key] || 'status-badge bg-gray-100 text-gray-700';
  const label = statusTranslations[key] || status;
  return (
    <span className={clsx(base, className)}>
      {label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = severity?.toLowerCase() ?? '';
  const color =
    s === 'critical' ? 'bg-red-100 text-red-800' :
    s === 'high' ? 'bg-orange-100 text-orange-800' :
    s === 'medium' ? 'bg-yellow-100 text-yellow-800' :
    s === 'low' ? 'bg-green-100 text-green-800' :
    'bg-gray-100 text-gray-700';
  const label = severityTranslations[s] || severity;
  return <span className={clsx('status-badge', color)}>{label}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priority?.toLowerCase() ?? '';
  const color =
    p === 'critical' ? 'bg-red-100 text-red-800' :
    p === 'high' ? 'bg-orange-100 text-orange-800' :
    p === 'medium' ? 'bg-yellow-100 text-yellow-800' :
    p === 'low' ? 'bg-green-100 text-green-800' :
    'bg-gray-100 text-gray-700';
  const label = priorityTranslations[p] || priority;
  return <span className={clsx('status-badge', color)}>{label}</span>;
}
