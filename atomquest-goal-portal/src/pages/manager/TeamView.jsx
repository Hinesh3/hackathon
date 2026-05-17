import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUsersByManager, getUserById } from '../../firebase/users';
import { getGoalsByManager } from '../../firebase/goals';
import { getAchievementsByGoalIds, addCheckInComment } from '../../firebase/achievements';
import { Badge, ScoreRing, LoadingScreen } from '../../components/UI';
import { computeScore, computeTimelineScore, computeWeightedScore } from '../../utils/scoring';
import { QUARTERS } from '../../firebase/seed';
import { useNavigate as useNav } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TeamView() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeQ, setActiveQ] = useState('Q1');
  const [comment, setComment] = useState('');
  const [commentGoalId, setCommentGoalId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const members = await getUsersByManager(userData.id);
      setTeam(members);
      if (members.length) {
        const g = await getGoalsByManager(members.map(m => m.id));
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

  const handleCheckin = async (goalId) => {
    if (!comment.trim()) { toast.error('Please enter a comment'); return; }
    setSaving(true);
    try {
      await addCheckInComment(goalId, activeQ, comment, userData.id, userData.name);
      toast.success('Check-in comment added!');
      setComment(''); setCommentGoalId(null);
      // refresh
      const g = await getGoalsByManager(team.map(m => m.id));
      const a = await getAchievementsByGoalIds(g.map(x => x.id));
      setGoals(g); setAchievements(a);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen />;

  const member = selectedMember ? team.find(m => m.id === selectedMember) : null;
  const memberGoals = selectedMember ? goals.filter(g => g.employeeId === selectedMember && g.status === 'approved') : [];
  const memberAch = achievements.filter(a => memberGoals.some(g => g.id === a.goalId));
  const overallScore = computeWeightedScore(memberGoals, memberAch);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">{member ? `${member.name} — Check-in` : 'My Team'}</h1>
          <p className="page-subtitle">{member ? `Quarter: ${activeQ}` : `${team.length} members`}</p>
        </div>
        {member && <button className="btn btn-outline" onClick={() => setSelectedMember(null)}>← Back to Team</button>}
      </div>

      <div className="page-body">
        {!member ? (
          <div className="grid grid-2">
            {team.map(m => {
              const mg = goals.filter(g => g.employeeId === m.id && g.status === 'approved');
              const ma = achievements.filter(a => mg.some(g => g.id === a.goalId));
              const score = computeWeightedScore(mg, ma);
              const pending = goals.filter(g => g.employeeId === m.id && g.status === 'submitted').length;
              return (
                <div key={m.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedMember(m.id)}>
                  <div className="flex items-center gap-3">
                    <div className="avatar" style={{ width: 48, height: 48 }}>
                      {m.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-sm text-muted">{m.department} · {mg.length} approved goals</div>
                      {pending > 0 && <span className="badge badge-amber mt-1">⏳ {pending} pending</span>}
                    </div>
                    <ScoreRing score={score || null} size={52} />
                  </div>
                </div>
              );
            })}
            {team.length === 0 && <div className="alert alert-info">No team members assigned.</div>}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6 card">
              <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.2rem' }}>
                {member.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="font-bold" style={{ fontSize: '1.1rem' }}>{member.name}</div>
                <div className="text-muted">{member.department} · {member.email}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScoreRing score={overallScore || null} size={64} />
                <div className="text-xs text-muted mt-1">Overall Score</div>
              </div>
            </div>

            <div className="tabs mb-6">
              {QUARTERS.map(q => <button key={q} className={`tab ${activeQ===q?'active':''}`} onClick={() => setActiveQ(q)}>{q}</button>)}
            </div>

            {memberGoals.length === 0 ? (
              <div className="alert alert-info">No approved goals for this employee.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {memberGoals.map(goal => {
                  const ach = achievements.find(a => a.goalId === goal.id && a.quarter === activeQ);
                  const score = ach ? (goal.uom === 'timeline' ? computeTimelineScore(goal.target, ach.actual) : computeScore(goal.uom, goal.target, ach.actual)) : null;
                  return (
                    <div key={goal.id} className="card">
                      <div className="flex items-start gap-4">
                        <div style={{ flex: 1 }}>
                          <div className="font-semibold">{goal.title}</div>
                          <div className="text-sm text-muted">{goal.thrustArea} · {goal.weightage}% weight</div>
                          <div className="flex gap-4 mt-3">
                            <div>
                              <div className="text-xs text-muted">Planned Target</div>
                              <div className="font-bold">{goal.target}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted">{activeQ} Actual</div>
                              <div className="font-bold" style={{ color: ach?.actual ? 'var(--success)' : 'var(--text-dim)' }}>
                                {ach?.actual ?? 'Not updated'}
                              </div>
                            </div>
                            {ach?.status && <div><div className="text-xs text-muted">Status</div><Badge status={ach.status} /></div>}
                          </div>
                          {ach?.checkInComment && (
                            <div className="mt-3 alert alert-success" style={{ padding: '0.5rem 0.75rem' }}>
                              <div className="text-xs font-semibold">Previous Check-in:</div>
                              <div className="text-sm">{ach.checkInComment.text}</div>
                            </div>
                          )}
                          {commentGoalId === goal.id ? (
                            <div className="mt-3 flex flex-col gap-2">
                              <textarea className="form-textarea" rows={3} placeholder="Add your check-in comment..."
                                value={comment} onChange={e => setComment(e.target.value)} />
                              <div className="flex gap-2">
                                <button className="btn btn-primary btn-sm" onClick={() => handleCheckin(goal.id)} disabled={saving}>
                                  {saving ? 'Saving...' : '💬 Save Comment'}
                                </button>
                                <button className="btn btn-outline btn-sm" onClick={() => setCommentGoalId(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button className="btn btn-outline btn-sm mt-3" onClick={() => { setCommentGoalId(goal.id); setComment(''); }}>
                              + Add Check-in Comment
                            </button>
                          )}
                        </div>
                        <ScoreRing score={score} size={60} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
