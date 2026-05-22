import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const NAV = [
  { to: '/app/observatorio', icon: '🔭', label: 'Observatorio' },
  { to: '/app/universo',     icon: '🪐', label: 'Universo',      soon: true },
  { to: '/app/estadisticas', icon: '📊', label: 'Estadísticas',  soon: true },
  { to: '/app/config',       icon: '⚙️', label: 'Configuración', soon: true },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">✦</span>
        <span className="sidebar-logo-text">STARGAZE</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon, label, soon }) =>
          soon ? (
            <div key={to} className="sidebar-item sidebar-item--soon">
              <span className="sidebar-icon">{icon}</span>
              <span className="sidebar-label">{label}</span>
              <span className="sidebar-soon-badge">soon</span>
            </div>
          ) : (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                'sidebar-item' + (isActive ? ' sidebar-item--active' : '')
              }
            >
              <span className="sidebar-icon">{icon}</span>
              <span className="sidebar-label">{label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">J</div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">Johan</span>
          <span className="sidebar-user-role">Explorador</span>
        </div>
      </div>
    </aside>
  );
}