import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const roleBadgeColor: Record<string, string> = {
    admin: '#4f46e5', analyst: '#0891b2', viewer: '#16a34a',
  };

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>💰 Finance Manager</span>
      <div style={styles.links}>
        <NavLink to="/" style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.active : {}) })}>Dashboard</NavLink>
        <NavLink to="/records" style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.active : {}) })}>Records</NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/users" style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.active : {}) })}>Users</NavLink>
        )}
      </div>
      <div style={styles.right}>
        <span style={{ ...styles.badge, background: roleBadgeColor[user?.role || 'viewer'] }}>
          {user?.role}
        </span>
        <span style={styles.name}>{user?.name}</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px', height: 56, background: '#1e1b4b', color: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  brand: { fontWeight: 700, fontSize: 16, marginRight: 16, whiteSpace: 'nowrap' },
  links: { display: 'flex', gap: 4, flex: 1 },
  link: { color: '#c7d2fe', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 14 },
  active: { background: '#4f46e5', color: '#fff' },
  right: { display: 'flex', alignItems: 'center', gap: 10 },
  badge: { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#fff', textTransform: 'uppercase' },
  name: { fontSize: 13, color: '#c7d2fe' },
  logoutBtn: { background: 'transparent', border: '1px solid #4f46e5', color: '#c7d2fe', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
};
