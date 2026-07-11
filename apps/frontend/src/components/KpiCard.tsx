import { ReactNode } from 'react';
import clsx from 'clsx';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
}

const colorMap = {
  blue: 'from-primary-500 to-hydraulic-600',
  red: 'from-red-500 to-red-600',
  green: 'from-green-500 to-green-600',
  yellow: 'from-yellow-500 to-yellow-600',
  purple: 'from-purple-500 to-purple-600',
};

const trendIcons = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

export default function KpiCard({ title, value, subtitle, icon, trend, color = 'blue' }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              {trend && <span className={clsx({ 'text-green-600': trend === 'up', 'text-red-600': trend === 'down' })}>{trendIcons[trend]}</span>}
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
