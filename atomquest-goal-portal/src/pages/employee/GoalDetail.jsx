import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getGoal, updateGoal } from '../../firebase/goals';
import { getAchievementsByGoal, upsertAchievement } from '../../firebase/achievements';
import { Badge, ScoreRing, LoadingScreen } from '../../components/UI';
import { computeScore, computeTimelineScore, getStatusLabel } from '../../utils/scoring';
import { THRUST_AREAS, UOM_TYPES, QUARTERS } from '../../firebase/seed';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['not_started', 'on_track', 'completed'];

export default function GoalDetail() {
  const { id } = useParams();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [activeQ, setActiveQ] = useState('Q1');
  const [ach, setAch] = useState({ actual: '', status: 'not_started' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  const load = async () => {
    try {
      const [g, a] = await Promise.all([getGoal(id), getAchievementsByGoal(id)]);
      setGoal(g); setAchievements(a);
      const qAch = a.find(x => x.quarter === activeQ);
      if (qAch) setAch({ actual: qAch.actual ?? '', status: qAch.status ?? 'not_started' });
      else setAch({ actual: '', status: 'not_started' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load goal data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    const qAch = achievements.find(x => x.quarter === activeQ);
    if (qAch) setAch({ actual: qAch.actual ?? '', status: qAch.status ?? 'not_started' });
    else setAch({ actual: '', status: 'not_started' });
  }, [activeQ, achievements]);

  const handleSaveAchievement = async () => {
    setSaving(true);
    try {
      const score = goal.uom === 'timeline'
        ? computeTimelineScore(goal.target, ach.actual)
        : computeScore(goal.uom, goal.target, ach.actual);
      await upsertAchievement({ goalId: id, quarter: activeQ, ...ach, score });
      toast.success('Achievement updated!');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleUpdateGoal = async () => {
    setSaving(true);
    try {
      await updateGoal(id, editForm, userData.id, userData.name, goal);
      toast.success('Goal updated!');
      setEditMode(false);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen />;
  if (!goal) return <div className="page-body"><div className="alert alert-error">Goal not found.</div></div>;

  const isLocked = goal.status === 'approved';
  const isOwner = goal.employeeId === userData.id;
  const canEdit = isOwner && ['draft', 'returned'].includes(goal.status) && !goal.isShared;
  const canUpdateAch = isOwner && isLocked;

  const currentAch = achievements.find(x => x.quarter === activeQ);
  const score = currentAch
    ? (goal.uom === 'timeline'
        ? computeTimelineScore(goal.target, currentAch.actual)
        : computeScore(goal.uom, goal.target, currentAch.actual))
    : null;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm mb-1" onClick={() => navigate('/employee/goals')}>← Back</button>
          <h1 className="page-title">{goal.title}</h1>
          <div className="flex gap-2 mt-1">
            <Badge status={goal.status} />
            {goal.isShared && <span className="badge badge-teal">🔗 Shared Goal</span>}
            <span className="chip">{goal.thrustArea}</span>
          </div>
        </div>
        <div className="flex gap-3">
          {canEdit && !editMode && (
            <button className="btn btn-outline" onClick={() => { setEditMode(true); setEditForm({ title: goal.title, description: goal.description, target: goal.target, weightage: goal.weightage }); }}>
              ✏️ Edit
            </button>
          )}
          {editMode && (
            <>
              <button className="btn btn-outline" onClick={() => setEditMode(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateGoal} disabled={saving}>Save Changes</button>
            </>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          {/* Goal info */}
          <div className="card">
            <h2 className="section-title">Goal Information</h2>
            {editMode ? (
              <div className="flex flex-col gap-3">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Target</label>
                    <input className="form-input" value={editForm.target} onChange={e => setEditForm(f => ({ ...f, target: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Weightage (%)</label>
                    <input className="form-input" type="number" min="10" value={editForm.weightage} onChange={e => setEditForm(f => ({ ...f, weightage: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[
                  ['Thrust Area', goal.thrustArea],
                  ['UoM Type', UOM_TYPES.find(u => u.value === goal.uom)?.label || goal.uom],
                  ['Target', goal.target],
                  ['Weightage', `${goal.weightage}%`],
                  ['Description', goal.description || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span className="text-muted text-sm">{label}</span>
                    <span className="font-semibold text-sm">{val}</span>
                  </div>
                ))}
                {goal.returnReason && (
                  <div className="alert alert-error">
                    <strong>Return Reason:</strong> {goal.returnReason}
                  </div>
                )}
                {isLocked && <div className="alert alert-warning">🔒 Goal is locked after approval. Contact Admin for changes.</div>}
              </div>
            )}
          </div>

          {/* Quarterly achievements */}
          <div className="card">
            <h2 className="section-title">Achievement Tracking</h2>
            <div className="tabs mb-4">
              {QUARTERS.map(q => (
                <button key={q} className={`tab ${activeQ === q ? 'active' : ''}`} onClick={() => setActiveQ(q)}>{q}</button>
              ))}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <ScoreRing score={score} size={72} />
              <div>
                <div className="text-muted text-sm">Planned Target</div>
                <div className="font-bold" style={{ fontSize: '1.25rem' }}>{goal.target}</div>
                <div className="text-muted text-sm mt-1">Actual: <strong style={{ color: 'var(--text)' }}>{currentAch?.actual ?? '—'}</strong></div>
              </div>
            </div>

            {canUpdateAch ? (
              <div className="flex flex-col gap-3">
                <div className="form-group">
                  <label className="form-label">Actual Achievement ({activeQ})</label>
                  <input className="form-input"
                    type={goal.uom === 'timeline' ? 'date' : 'number'}
                    placeholder="Enter actual value"
                    value={ach.actual}
                    onChange={e => setAch(a => ({ ...a, actual: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={ach.status} onChange={e => setAch(a => ({ ...a, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary" onClick={handleSaveAchievement} disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Achievement'}
                </button>
              </div>
            ) : (
              <div className="alert alert-info">
                {!isLocked ? 'Goal must be approved before logging achievements.' : 'You can update achievements for approved goals.'}
              </div>
            )}

            {currentAch?.checkInComment && (
              <div className="mt-4 card" style={{ background: 'var(--surface)' }}>
                <div className="text-sm font-semibold mb-1">💬 Manager Check-in Comment</div>
                <div className="text-sm text-muted">{currentAch.checkInComment.text}</div>
                <div className="text-xs text-dim mt-1">— {currentAch.checkInComment.by}</div>
              </div>
            )}
          </div>
        </div>

        {/* All quarters summary */}
        <div className="card mt-6">
          <h2 className="section-title">All Quarters Summary</h2>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Quarter</th><th>Planned</th><th>Actual</th><th>Status</th><th>Score</th><th>Manager Comment</th></tr></thead>
              <tbody>
                {QUARTERS.map(q => {
                  const a = achievements.find(x => x.quarter === q);
                  const s = a ? (goal.uom === 'timeline' ? computeTimelineScore(goal.target, a.actual) : computeScore(goal.uom, goal.target, a.actual)) : null;
                  return (
                    <tr key={q}>
                      <td><strong>{q}</strong></td>
                      <td>{goal.target}</td>
                      <td>{a?.actual ?? '—'}</td>
                      <td>{a ? <Badge status={a.status} /> : <span className="text-dim">—</span>}</td>
                      <td>{s !== null ? <span style={{ color: s >= 70 ? 'var(--success)' : 'var(--error)', fontWeight: 700 }}>{Math.round(s)}%</span> : '—'}</td>
                      <td className="text-sm text-muted">{a?.checkInComment?.text || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
