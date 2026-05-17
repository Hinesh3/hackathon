import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const employeeLinks = [
  { path: '/employee/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/employee/goals', label: 'My Goals', icon: '🎯' },
  { path: '/employee/goals/new', label: 'Add Goal', icon: '+' },
];
const managerLinks = [
  { path: '/manager/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/manager/team', label: 'My Team', icon: '👥' },
  { path: '/manager/approvals', label: 'Pending Approvals', icon: '✓' },
];
const adminLinks = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/admin/users', label: 'Users', icon: '👤' },
  { path: '/admin/cycles', label: 'Cycles', icon: '📅' },
  { path: '/admin/shared-goals', label: 'Shared Goals', icon: '🔗' },
  { path: '/admin/reports', label: 'Reports', icon: '📊' },
  { path: '/admin/audit', label: 'Audit Log', icon: '🔍' },
];

const roleLinks = { employee: employeeLinks, manager: managerLinks, admin: adminLinks };
const roleBadgeClass = { employee: 'badge-blue', manager: 'badge-teal', admin: 'badge-amber' };

export default function Sidebar() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (!userData) return null;
  const links = roleLinks[userData.role] || [];
  const initials = userData.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">PE</div>
        <div>
          <div className="logo-text">PerformEdge</div>
          <div className="logo-sub">Goal Tracker</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {links.map(link => (
          <button
            key={link.path}
            className={`nav-link ${location.pathname === link.path || location.pathname.startsWith(link.path + '/') ? 'active' : ''}`}
            onClick={() => navigate(link.path)}
          >
            <span className="icon">{link.icon}</span>
            {link.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{userData.name}</div>
            <div className="user-role mt-1">
              <span className={`badge ${roleBadgeClass[userData.role]}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                {userData.role}
              </span>
            </div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm w-full" onClick={logout} style={{ marginTop: '0.5rem' }}>
          ⏏ Logout
        </button>
      </div>
    </aside>
  );
}
