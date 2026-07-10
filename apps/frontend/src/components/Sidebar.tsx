import { NavLink } from 'react-router-dom';
import { useAuth } from '../services/auth';
import {
  LayoutDashboard, LineChart, Map, Ticket, Brain, FileText, Settings, Droplets, LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/monitoring', label: 'Monitoreo', icon: LineChart },
  { to: '/dmas', label: 'Mapa de DMAs', icon: Map },
  { to: '/incidents', label: 'Incidencias', icon: Ticket },
  { to: '/analytics', label: 'Analítica IA', icon: Brain },
  { to: '/reports', label: 'Reportes', icon: FileText },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-sidebar-bg text-white flex flex-col shrink-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-hydraulic-500 flex items-center justify-center">
          <Droplets className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">SGIP-CAP</h1>
          <p className="text-xs text-blue-200">SEDALIB</p>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-active text-white shadow-lg'
                  : 'text-blue-200 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-primary-400 text-white flex items-center justify-center text-xs font-bold">
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username || 'Admin'}</p>
            <p className="text-xs text-blue-300 truncate">{user?.role || 'operator'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-blue-300 hover:bg-sidebar-hover hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
