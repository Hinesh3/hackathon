import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsersByManager } from '../../firebase/users';
import { getGoalsByManager } from '../../firebase/goals';
import { getAchievementsByGoalIds } from '../../firebase/achievements';
import { StatCard, Badge, LoadingScreen, ScoreRing } from '../../components/UI';
import { computeWeightedScore } from '../../utils/scoring';
import { useNavigate } from 'react-router-dom';

export default function ManagerDashboard() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const members = await getUsersByManager(userData.id);
      setTeam(members);
      if (members.length) {
        const ids = members.map(m => m.id);
        const g = await getGoalsByManager(ids);
        setGoals(g);
        if (g.length) {
          const a = await getAchievementsByGoalIds(g.map(x => x.id));
          setAchievements(a);
        }
      }
      setLoading(false);
    };
    load();
  }, [userData.id]);

  if (loading) return <LoadingScreen />;

  const pending = goals.filter(g => g.status === 'submitted');
  const approved = goals.filter(g => g.status === 'approved');

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manager Dashboard</h1>
          <p className="page-subtitle">Managing {team.length} team member{team.length !== 1 ? 's' : ''}</p>
        </div>
        {pending.length > 0 && (
          <button className="btn btn-accent" onClick={() => navigate('/manager/approvals')}>
            ⚠ {pending.length} Pending Approval{pending.length > 1 ? 's' : ''}
          </button>
        )}
      </div>
      <div className="page-body">
        <div className="grid grid-4 mb-6">
          <StatCard icon="👥" label="Team Members" value={team.length} color="var(--primary-light)" />
          <StatCard icon="⏳" label="Pending Approvals" value={pending.length} color="var(--warning)" />
          <StatCard icon="✅" label="Approved Goals" value={approved.length} color="var(--success)" />
          <StatCard icon="🎯" label="Total Goals" value={goals.length} color="var(--accent)" />
        </div>

        {pending.length > 0 && (
          <div className="alert alert-warning mb-6">
            🔔 <strong>{pending.length} goal(s)</strong> are awaiting your approval.
            <button className="btn btn-sm btn-outline" style={{ marginLeft: '1rem' }} onClick={() => navigate('/manager/approvals')}>
              Review Now →
            </button>
          </div>
        )}

        <h2 className="section-title">Team Overview</h2>
        {team.length === 0 ? (
          <div className="alert alert-info">No team members assigned to you yet. Contact Admin.</div>
        ) : (
          <div className="grid grid-2">
            {team.map(member => {
              const memberGoals = goals.filter(g => g.employeeId === member.id);
              const memberApproved = memberGoals.filter(g => g.status === 'approved');
              const memberPending = memberGoals.filter(g => g.status === 'submitted');
              const memberAch = achievements.filter(a => memberGoals.some(g => g.id === a.goalId));
              const score = computeWeightedScore(memberApproved, memberAch);
              const totalW = memberGoals.filter(g => ['draft','submitted'].includes(g.status)).reduce((s, g) => s + (Number(g.weightage)||0), 0);

              return (
                <div key={member.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/manager/team/${member.id}`)}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="avatar" style={{ width: 48, height: 48, fontSize: '1.1rem' }}>
                      {member.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="font-semibold">{member.name}</div>
                      <div className="text-sm text-muted">{member.department}</div>
                    </div>
                    <ScoreRing score={score || null} size={52} />
                  </div>
                  <div className="grid grid-3" style={{ gap: '0.5rem', textAlign: 'center' }}>
                    {[
                      { label: 'Goals', val: memberGoals.length, color: 'var(--text)' },
                      { label: 'Pending', val: memberPending.length, color: memberPending.length ? 'var(--warning)' : 'var(--text-muted)' },
                      { label: 'Approved', val: memberApproved.length, color: 'var(--success)' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'var(--surface)', borderRadius: '8px', padding: '0.5rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                        <div className="text-xs text-muted">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {memberPending.length > 0 && (
                    <div className="mt-3">
                      <button className="btn btn-accent btn-sm w-full" onClick={e => { e.stopPropagation(); navigate(`/manager/approvals?emp=${member.id}`); }}>
                        Review Goals →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
