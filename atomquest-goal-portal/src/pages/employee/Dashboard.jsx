import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getGoalsByEmployee } from '../../firebase/goals';
import { getAchievementsByGoalIds } from '../../firebase/achievements';
import { getCurrentCycle } from '../../firebase/users';
import { StatCard, LoadingScreen, EmptyState, Badge, ScoreRing, WeightageBar } from '../../components/UI';
import { computeScore, computeWeightedScore } from '../../utils/scoring';
import { useNavigate } from 'react-router-dom';

const PHASE_MAP = {
  goal_setting: { label: 'Goal Setting Phase', color: 'var(--accent)', icon: '✏️' },
  Q1: { label: 'Q1 Check-in Open', color: 'var(--info)', icon: '📊' },
  Q2: { label: 'Q2 Check-in Open', color: 'var(--info)', icon: '📊' },
  Q3: { label: 'Q3 Check-in Open', color: 'var(--info)', icon: '📊' },
  Q4: { label: 'Q4 / Annual Review', color: 'var(--success)', icon: '🏁' },
};

export default function EmployeeDashboard() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [g, c] = await Promise.all([
          getGoalsByEmployee(userData.id),
          getCurrentCycle(),
        ]);
        setGoals(g);
        setCycle(c);
        if (g.length) {
          const a = await getAchievementsByGoalIds(g.map(x => x.id));
          setAchievements(a);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [userData.id]);

  if (loading) return <LoadingScreen />;

  const approved = goals.filter(g => g.status === 'approved');
  const submitted = goals.filter(g => g.status === 'submitted');
  const draft = goals.filter(g => g.status === 'draft');
  const activeGoals = goals.filter(g => ['draft','submitted','approved','returned'].includes(g.status));
  const totalWeight = activeGoals.reduce((s, g) => s + (Number(g.weightage) || 0), 0);
  const weightOk = totalWeight === 100;
  const overallScore = computeWeightedScore(approved, achievements);
  const phase = cycle ? PHASE_MAP[cycle.currentPhase] : null;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {userData.name?.split(' ')[0]} 👋</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/employee/goals/new')}>
          + Add Goal
        </button>
      </div>

      <div className="page-body">
        {/* Current phase banner */}
        {phase && (
          <div className="alert alert-info mb-6" style={{ background: `${phase.color}15`, borderColor: `${phase.color}40`, color: phase.color }}>
            <span style={{ fontSize: '1.1rem' }}>{phase.icon}</span>
            <div>
              <strong>{phase.label}</strong>
              {cycle && <span className="text-sm" style={{ marginLeft: '0.5rem', opacity: 0.8 }}>· Cycle {cycle.year}</span>}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-4 mb-6">
          <StatCard icon="🎯" label="Total Goals" value={goals.length} color="var(--primary-light)" change={`Max 8 allowed`} />
          <StatCard icon="✅" label="Approved" value={approved.length} color="var(--success)" />
          <StatCard icon="⏳" label="Pending Review" value={submitted.length} color="var(--warning)" />
          <StatCard icon="📈" label="Overall Score" value={overallScore ? `${overallScore}%` : '—'} color="var(--accent)" change="Weighted avg." />
        </div>

        {/* Weightage summary */}
        {goals.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title" style={{ marginBottom: 0 }}>Weightage Allocation</h2>
              {!weightOk && (
                <span className="badge badge-red">⚠ Total must equal 100%</span>
              )}
            </div>
            <WeightageBar goals={goals} />
            {submitted.length > 0 && (
              <div className="alert alert-info mt-4">
                <span>⏳</span> {submitted.length} goal(s) are pending manager approval.
              </div>
            )}
            {draft.length > 0 && !submitted.length && weightOk && (
              <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={() => navigate('/employee/goals')}>
                  Submit Goals for Approval →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Goal cards */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title" style={{ marginBottom: 0 }}>My Goals</h2>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/employee/goals')}>View All</button>
        </div>

        {goals.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No goals yet"
            desc="Start by adding your first goal for this cycle"
            action={<button className="btn btn-primary" onClick={() => navigate('/employee/goals/new')}>+ Add First Goal</button>}
          />
        ) : (
          <div className="grid grid-2">
            {goals.slice(0, 4).map(goal => {
              const goalAch = achievements.filter(a => a.goalId === goal.id);
              const latest = goalAch[goalAch.length - 1];
              const score = latest ? computeScore(goal.uom, goal.target, latest.actual) : null;
              return (
                <div key={goal.id} className="goal-card" onClick={() => navigate(`/employee/goals/${goal.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="goal-card-header">
                    <div style={{ flex: 1 }}>
                      <div className="goal-title">{goal.title}</div>
                      <div className="goal-meta">
                        <Badge status={goal.status} />
                        {goal.isShared && <span className="badge badge-teal">🔗 Shared</span>}
                        <span className="chip">{goal.thrustArea}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="goal-weightage">{goal.weightage}%</div>
                      <div className="goal-weightage-label">weight</div>
                    </div>
                  </div>
                  {goal.status === 'approved' && (
                    <div className="flex items-center justify-between mt-2">
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(score || 0, 100)}%` }} />
                        </div>
                        <div className="text-xs text-muted mt-1">
                          Target: {goal.target} · Actual: {latest?.actual ?? '—'}
                        </div>
                      </div>
                      <div style={{ marginLeft: '1rem' }}>
                        <ScoreRing score={score} size={48} />
                      </div>
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
