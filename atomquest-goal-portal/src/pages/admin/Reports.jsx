import { useState, useEffect } from 'react';
import { getAllGoals } from '../../firebase/goals';
import { getAllUsers } from '../../firebase/users';
import { getAllAchievements } from '../../firebase/achievements';
import { LoadingScreen } from '../../components/UI';
import { exportToExcel, exportToCSV, buildAchievementReport } from '../../utils/export';
import { computeScore, computeTimelineScore } from '../../utils/scoring';
import toast from 'react-hot-toast';

export default function Reports() {
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ dept: '', status: '', quarter: 'Q1' });

  useEffect(() => {
    const load = async () => {
      const [g, u, a] = await Promise.all([getAllGoals(), getAllUsers(), getAllAchievements()]);
      setGoals(g); setUsers(u); setAchievements(a); setLoading(false);
    };
    load();
  }, []);

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const depts = [...new Set(users.map(u => u.department).filter(Boolean))];
  const quarters = ['Q1','Q2','Q3','Q4','Annual'];

  const filtered = goals.filter(g => {
    const u = userMap[g.employeeId];
    if (filter.dept && u?.department !== filter.dept) return false;
    if (filter.status && g.status !== filter.status) return false;
    return true;
  });

  const handleExcel = () => {
    const data = buildAchievementReport(filtered, achievements, users);
    if (!data.length) { toast.error('No data to export'); return; }
    exportToExcel(data, `achievement-report-${filter.quarter}`);
    toast.success('Excel exported!');
  };

  const handleCSV = () => {
    const data = buildAchievementReport(filtered, achievements, users);
    if (!data.length) { toast.error('No data to export'); return; }
    exportToCSV(data, `achievement-report-${filter.quarter}`);
    toast.success('CSV exported!');
  };

  // Check-in completion stats
  const empCheckins = {};
  achievements.filter(a => a.quarter === filter.quarter && a.checkInBy).forEach(a => {
    const goal = goals.find(g => g.id === a.goalId);
    if (goal) empCheckins[goal.employeeId] = true;
  });
  const totalEmps = users.filter(u => u.role === 'employee').length;
  const checkinDone = Object.keys(empCheckins).length;

  if (loading) return <LoadingScreen />;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">Reports & Analytics</h1><p className="page-subtitle">Achievement report + completion dashboard</p></div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={handleCSV}>📄 Export CSV</button>
          <button className="btn btn-primary" onClick={handleExcel}>📊 Export Excel</button>
        </div>
      </div>
      <div className="page-body">
        {/* Completion dashboard */}
        <div className="grid grid-3 mb-6">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>{checkinDone}</div>
            <div className="text-muted text-sm">Check-ins Completed ({filter.quarter})</div>
            <div className="progress-bar mt-2"><div className="progress-fill" style={{ width: `${totalEmps ? (checkinDone/totalEmps)*100 : 0}%` }} /></div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning)' }}>{totalEmps - checkinDone}</div>
            <div className="text-muted text-sm">Pending Check-ins ({filter.quarter})</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-light)' }}>
              {totalEmps ? Math.round((checkinDone/totalEmps)*100) : 0}%
            </div>
            <div className="text-muted text-sm">Completion Rate</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="flex gap-4 items-end" style={{ flexWrap: 'wrap' }}>
            <div className="form-group">
              <label className="form-label">Quarter</label>
              <select className="form-select" value={filter.quarter} onChange={e => setFilter(f => ({ ...f, quarter: e.target.value }))}>
                {quarters.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" value={filter.dept} onChange={e => setFilter(f => ({ ...f, dept: e.target.value }))}>
                <option value="">All Departments</option>
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Goal Status</label>
              <select className="form-select" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
                <option value="">All</option>
                {['draft','submitted','approved','returned'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setFilter({ dept: '', status: '', quarter: 'Q1' })}>Reset</button>
          </div>
        </div>

        {/* Report table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th><th>Dept</th><th>Thrust Area</th><th>Goal</th>
                <th>Target</th><th>Weight</th><th>Actual ({filter.quarter})</th>
                <th>Status</th><th>Score</th><th>Check-in</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(goal => {
                const u = userMap[goal.employeeId];
                const ach = achievements.find(a => a.goalId === goal.id && a.quarter === filter.quarter);
                const score = ach ? (goal.uom === 'timeline'
                  ? computeTimelineScore(goal.target, ach.actual)
                  : computeScore(goal.uom, goal.target, ach.actual)) : null;
                return (
                  <tr key={goal.id}>
                    <td className="font-semibold">{u?.name || '—'}</td>
                    <td className="text-sm text-muted">{u?.department}</td>
                    <td><span className="chip">{goal.thrustArea}</span></td>
                    <td className="font-semibold" style={{ maxWidth: 200 }}>{goal.title}</td>
                    <td>{goal.target}</td>
                    <td><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{goal.weightage}%</span></td>
                    <td style={{ color: ach?.actual ? 'var(--success)' : 'var(--text-dim)' }}>{ach?.actual ?? '—'}</td>
                    <td>{ach?.status ? <span className={`badge ${ach.status === 'completed' ? 'badge-green' : ach.status === 'on_track' ? 'badge-blue' : 'badge-gray'}`}>{ach.status.replace('_',' ')}</span> : '—'}</td>
                    <td>
                      {score !== null ? (
                        <span style={{ fontWeight: 700, color: score >= 70 ? 'var(--success)' : 'var(--error)' }}>{Math.round(score)}%</span>
                      ) : '—'}
                    </td>
                    <td>{ach?.checkInComment ? <span className="badge badge-green">✓ Done</span> : <span className="badge badge-gray">Pending</span>}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No data found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
