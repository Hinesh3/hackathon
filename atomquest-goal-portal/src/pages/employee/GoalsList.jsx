import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getGoalsByEmployee, submitGoals, deleteGoal } from '../../firebase/goals';
import { Badge, EmptyState, LoadingScreen, WeightageBar } from '../../components/UI';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function GoalsList() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const g = await getGoalsByEmployee(userData.id);
      setGoals(g);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [userData.id]);

  const activeGoals = goals.filter(g => ['draft','submitted','approved','returned'].includes(g.status));
  const totalWeight = activeGoals.reduce((s, g) => s + (Number(g.weightage) || 0), 0);
  const draftGoals = goals.filter(g => g.status === 'draft');
  const canSubmit = draftGoals.length > 0 && totalWeight === 100;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await submitGoals(userData.id);
      toast.success('Goals submitted for approval!');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (goalId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this goal?')) return;
    try {
      await deleteGoal(goalId);
      toast.success('Goal deleted');
      load();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <LoadingScreen />;

  const grouped = {
    draft: goals.filter(g => g.status === 'draft'),
    submitted: goals.filter(g => g.status === 'submitted'),
    approved: goals.filter(g => g.status === 'approved'),
    returned: goals.filter(g => g.status === 'returned'),
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Goals</h1>
          <p className="page-subtitle">{goals.length}/8 goals · {totalWeight}% total weightage</p>
        </div>
        <div className="flex gap-3">
          {draftGoals.length > 0 && (
            <button className="btn btn-accent" onClick={handleSubmit} disabled={submitting || !canSubmit}
              title={!canSubmit ? 'Total weightage must equal 100%' : ''}>
              {submitting ? 'Submitting...' : '📤 Submit for Approval'}
            </button>
          )}
          {goals.length < 8 && (
            <button className="btn btn-primary" onClick={() => navigate('/employee/goals/new')}>+ Add Goal</button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Validation alerts */}
        {draftGoals.length > 0 && totalWeight !== 100 && (
          <div className="alert alert-warning mb-4">
            ⚠ Total weightage is {totalWeight}%. It must equal 100% before you can submit.
          </div>
        )}
        {grouped.returned.length > 0 && (
          <div className="alert alert-error mb-4">
            ❌ {grouped.returned.length} goal(s) returned by manager. Please review and resubmit.
          </div>
        )}

        {goals.length > 0 && <div className="mb-6"><WeightageBar goals={goals} /></div>}

        {goals.length === 0 ? (
          <EmptyState icon="🎯" title="No goals yet" desc="Add up to 8 goals with total weightage of 100%"
            action={<button className="btn btn-primary" onClick={() => navigate('/employee/goals/new')}>+ Add First Goal</button>}
          />
        ) : (
          ['returned', 'draft', 'submitted', 'approved'].map(status => {
            const statusGoals = grouped[status];
            if (!statusGoals.length) return null;
            return (
              <div key={status} className="mb-6">
                <h2 className="section-title" style={{ textTransform: 'capitalize' }}>
                  {status === 'draft' ? '📝 Draft Goals' :
                   status === 'submitted' ? '⏳ Pending Approval' :
                   status === 'approved' ? '✅ Approved Goals' : '❌ Returned Goals'}
                </h2>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Goal Title</th>
                        <th>Thrust Area</th>
                        <th>UoM</th>
                        <th>Target</th>
                        <th>Weightage</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusGoals.map(goal => (
                        <tr key={goal.id} onClick={() => navigate(`/employee/goals/${goal.id}`)} style={{ cursor: 'pointer' }}>
                          <td>
                            <div className="font-semibold">{goal.title}</div>
                            {goal.isShared && <span className="badge badge-teal" style={{ fontSize: '0.65rem' }}>🔗 Shared</span>}
                            {goal.returnReason && <div className="text-xs text-error mt-1">Reason: {goal.returnReason}</div>}
                          </td>
                          <td><span className="chip">{goal.thrustArea}</span></td>
                          <td className="text-sm text-muted">{goal.uom?.replace('_', ' ')}</td>
                          <td className="font-semibold">{goal.target}</td>
                          <td><span className="font-bold text-accent">{goal.weightage}%</span></td>
                          <td><Badge status={goal.status} /></td>
                          <td>
                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                              {['draft', 'returned'].includes(goal.status) && !goal.isShared && (
                                <>
                                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/employee/goals/${goal.id}`)}>Edit</button>
                                  <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(goal.id, e)}>Del</button>
                                </>
                              )}
                              {goal.status === 'approved' && (
                                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/employee/goals/${goal.id}`)}>Update</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
