import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/app/observatorio', icon: '🔭', label: 'Observatorio' },
  { to: '/app/universo',     icon: '🌌', label: 'Universo'     },
  { to: '#', icon: '📊', label: 'Estadísticas',  soon: true },
  { to: '#', icon: '⚙️', label: 'Configuración', soon: true },
];

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Explorador';
  const avatar = displayName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar card">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">✦</span>
        <span className="sidebar-logo-text text-gradient">STARGAZE</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) =>
          item.soon ? (
            <div key={item.label} className="sidebar-item sidebar-item--soon">
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
              <span className="sidebar-soon-badge">pronto</span>
            </div>
          ) : (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-item${isActive ? ' sidebar-item--active' : ''}`
              }
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      {/* User + logout */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{avatar}</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{displayName}</p>
          <p className="sidebar-user-role">Explorador</p>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout} title="Cerrar sesión">
          ⏻
        </button>
      </div>
    </aside>
  );
}
