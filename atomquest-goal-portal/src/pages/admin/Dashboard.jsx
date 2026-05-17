import { useState, useEffect } from 'react';
import { getAllUsers, updateUser, createUserDoc, getAllCycles, createCycle, updateCycle } from '../../firebase/users';
import { getAllGoals } from '../../firebase/goals';
import { getAllAchievements } from '../../firebase/achievements';
import { StatCard, Badge, LoadingScreen, EmptyState } from '../../components/UI';
import { computeWeightedScore } from '../../utils/scoring';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [u, g, a, cycles] = await Promise.all([getAllUsers(), getAllGoals(), getAllAchievements(), getAllCycles()]);
      setUsers(u); setGoals(g); setAchievements(a);
      setCycle(cycles[0] || null);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <LoadingScreen />;

  const employees = users.filter(u => u.role === 'employee');
  const managers = users.filter(u => u.role === 'manager');
  const submitted = goals.filter(g => g.status === 'submitted').length;
  const approved = goals.filter(g => g.status === 'approved').length;
  const empWithGoals = [...new Set(goals.map(g => g.employeeId))].length;
  const completionRate = employees.length ? Math.round((empWithGoals / employees.length) * 100) : 0;

  const PHASES = ['goal_setting', 'Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Organization-wide overview · {cycle?.year || 'No active cycle'}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={() => navigate('/admin/reports')}>📊 Reports</button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>+ Add User</button>
        </div>
      </div>

      <div className="page-body">
        {/* Current cycle info */}
        {cycle && (
          <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(13,115,119,0.1), rgba(245,166,35,0.05))', borderColor: 'rgba(13,115,119,0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold" style={{ fontSize: '1.1rem' }}>🗓 Active Cycle: {cycle.year}</div>
                <div className="text-muted text-sm mt-1">Current Phase: <strong style={{ color: 'var(--accent)' }}>{cycle.currentPhase?.toUpperCase()}</strong></div>
              </div>
              <div className="flex gap-2">
                {PHASES.map(p => (
                  <div key={p} style={{ padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: cycle.currentPhase === p ? 'var(--accent)' : 'var(--surface)', color: cycle.currentPhase === p ? '#000' : 'var(--text-dim)', border: '1px solid var(--border)' }}>
                    {p.replace('_', ' ')}
                  </div>
                ))}
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/cycles')}>Manage →</button>
            </div>
          </div>
        )}

        <div className="grid grid-4 mb-6">
          <StatCard icon="👥" label="Total Employees" value={employees.length} color="var(--primary-light)" />
          <StatCard icon="⏳" label="Pending Approvals" value={submitted} color="var(--warning)"
            change={submitted > 0 ? 'Action required' : 'All reviewed'} />
          <StatCard icon="✅" label="Approved Goals" value={approved} color="var(--success)" />
          <StatCard icon="📈" label="Goal Completion" value={`${completionRate}%`} color="var(--accent)"
            change={`${empWithGoals}/${employees.length} employees`} />
        </div>

        {submitted > 0 && (
          <div className="alert alert-warning mb-6">
            ⚠ <strong>{submitted} goal(s)</strong> pending manager approval across the org.
          </div>
        )}

        {/* Per-manager completion */}
        <h2 className="section-title">Manager Completion Overview</h2>
        <div className="table-wrapper mb-6">
          <table>
            <thead><tr><th>Manager</th><th>Team Size</th><th>Goals Submitted</th><th>Goals Approved</th><th>Pending</th><th>Actions</th></tr></thead>
            <tbody>
              {managers.map(mgr => {
                const team = users.filter(u => u.managerId === mgr.id);
                const teamGoals = goals.filter(g => team.some(m => m.id === g.employeeId));
                const sub = teamGoals.filter(g => g.status === 'submitted').length;
                const app = teamGoals.filter(g => g.status === 'approved').length;
                return (
                  <tr key={mgr.id}>
                    <td><div className="font-semibold">{mgr.name}</div><div className="text-xs text-muted">{mgr.department}</div></td>
                    <td>{team.length}</td>
                    <td>{teamGoals.filter(g => g.status !== 'draft').length}</td>
                    <td><span style={{ color: 'var(--success)', fontWeight: 700 }}>{app}</span></td>
                    <td>{sub > 0 ? <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{sub}</span> : <span className="text-dim">—</span>}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/reports')}>View Report</button>
                    </td>
                  </tr>
                );
              })}
              {managers.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No managers found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick links */}
        <div className="grid grid-3">
          {[
            { icon: '👤', label: 'User Management', desc: 'Add, edit, assign roles', path: '/admin/users', color: 'var(--primary)' },
            { icon: '🔗', label: 'Shared Goals', desc: 'Push KPIs to employees', path: '/admin/shared-goals', color: 'var(--accent)' },
            { icon: '🔍', label: 'Audit Log', desc: 'Track all goal changes', path: '/admin/audit', color: 'var(--info)' },
          ].map(item => (
            <div key={item.path} className="card" style={{ cursor: 'pointer', borderLeft: `3px solid ${item.color}` }} onClick={() => navigate(item.path)}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
              <div className="font-bold">{item.label}</div>
              <div className="text-sm text-muted">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
