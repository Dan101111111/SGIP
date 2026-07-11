import clsx from 'clsx';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

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
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status?.toLowerCase().replace(/\s+/g, '_') ?? '';
  const base = normalMap[key] || 'status-badge bg-gray-100 text-gray-700';
  return (
    <span className={clsx(base, className)}>
      {status}
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
  return <span className={clsx('status-badge', color)}>{severity}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priority?.toLowerCase() ?? '';
  const color =
    p === 'critical' ? 'bg-red-100 text-red-800' :
    p === 'high' ? 'bg-orange-100 text-orange-800' :
    p === 'medium' ? 'bg-yellow-100 text-yellow-800' :
    p === 'low' ? 'bg-green-100 text-green-800' :
    'bg-gray-100 text-gray-700';
  return <span className={clsx('status-badge', color)}>{priority}</span>;
}
