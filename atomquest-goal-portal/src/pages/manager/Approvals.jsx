import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsersByManager } from '../../firebase/users';
import { getGoalsByManager, approveGoals, returnGoals, updateGoal } from '../../firebase/goals';
import { Badge, LoadingScreen, EmptyState, WeightageBar } from '../../components/UI';
import { Modal, ModalBody, ModalFooter } from '../../components/Modal';
import { UOM_TYPES } from '../../firebase/seed';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Approvals() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [team, setTeam] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState(searchParams.get('emp') || null);
  const [returnReason, setReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [inlineEdits, setInlineEdits] = useState({});
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    const members = await getUsersByManager(userData.id);
    setTeam(members);
    const ids = members.map(m => m.id);
    const g = ids.length ? await getGoalsByManager(ids) : [];
    setGoals(g.filter(x => x.status === 'submitted'));
    setLoading(false);
  };

  useEffect(() => { load(); }, [userData.id]);

  const empGoals = selectedEmp ? goals.filter(g => g.employeeId === selectedEmp) : goals;
  const empName = team.find(m => m.id === selectedEmp)?.name || 'All Employees';
  const totalW = empGoals.reduce((s, g) => s + (Number(inlineEdits[g.id]?.weightage ?? g.weightage) || 0), 0);

  const handleApprove = async () => {
    if (!empGoals.length) return;
    setProcessing(true);
    try {
      // Apply inline edits first
      for (const goal of empGoals) {
        const edits = inlineEdits[goal.id];
        if (edits && Object.keys(edits).length) {
          await updateGoal(goal.id, edits, userData.id, userData.name, goal);
        }
      }
      await approveGoals(empGoals.map(g => g.id), userData.id, userData.name);
      toast.success(`${empGoals.length} goal(s) approved!`);
      setInlineEdits({});
      load();
    } catch (err) { toast.error(err.message); }
    finally { setProcessing(false); }
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) { toast.error('Please provide a return reason'); return; }
    setProcessing(true);
    try {
      await returnGoals(empGoals.map(g => g.id), returnReason, userData.id, userData.name);
      toast.success('Goals returned for revision');
      setShowReturnModal(false); setReturnReason('');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setProcessing(false); }
  };

  const setInlineEdit = (goalId, field, val) => {
    setInlineEdits(e => ({ ...e, [goalId]: { ...(e[goalId] || {}), [field]: field === 'weightage' ? Number(val) : val } }));
  };

  if (loading) return <LoadingScreen />;

  const submittedByEmp = {};
  goals.forEach(g => {
    if (!submittedByEmp[g.employeeId]) submittedByEmp[g.employeeId] = 0;
    submittedByEmp[g.employeeId]++;
  });

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pending Approvals</h1>
          <p className="page-subtitle">{goals.length} goal(s) awaiting review</p>
        </div>
      </div>
      <div className="page-body">
        {/* Employee filter */}
        <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${!selectedEmp ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSelectedEmp(null)}>
            All ({goals.length})
          </button>
          {team.filter(m => submittedByEmp[m.id]).map(m => (
            <button key={m.id} className={`btn btn-sm ${selectedEmp === m.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSelectedEmp(m.id)}>
              {m.name.split(' ')[0]} ({submittedByEmp[m.id]})
            </button>
          ))}
        </div>

        {empGoals.length === 0 ? (
          <EmptyState icon="✅" title="No pending approvals" desc="All goals have been reviewed" />
        ) : (
          <>
            {/* Weightage check */}
            {selectedEmp && (
              <div className="mb-4">
                <WeightageBar goals={empGoals.map(g => ({ ...g, weightage: inlineEdits[g.id]?.weightage ?? g.weightage }))} />
                {totalW !== 100 && <div className="alert alert-warning mt-2">⚠ Total weightage is {totalW}%. Must equal 100% before approving.</div>}
              </div>
            )}

            <div className="table-wrapper mb-4">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th><th>Goal Title</th><th>Thrust Area</th><th>UoM</th>
                    <th>Target (editable)</th><th>Weightage % (editable)</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {empGoals.map(goal => {
                    const emp = team.find(m => m.id === goal.employeeId);
                    const edit = inlineEdits[goal.id] || {};
                    return (
                      <tr key={goal.id}>
                        <td><div className="font-semibold text-sm">{emp?.name}</div><div className="text-xs text-muted">{emp?.department}</div></td>
                        <td><div className="font-semibold">{goal.title}</div>{goal.description && <div className="text-xs text-muted">{goal.description}</div>}</td>
                        <td><span className="chip">{goal.thrustArea}</span></td>
                        <td className="text-sm">{UOM_TYPES.find(u => u.value === goal.uom)?.label?.split('(')[0]}</td>
                        <td>
                          <input className="form-input" style={{ width: 120 }}
                            defaultValue={goal.target}
                            onChange={e => setInlineEdit(goal.id, 'target', e.target.value)}
                          />
                        </td>
                        <td>
                          <input className="form-input" style={{ width: 80 }} type="number" min="10"
                            defaultValue={goal.weightage}
                            onChange={e => setInlineEdit(goal.id, 'weightage', e.target.value)}
                          />
                        </td>
                        <td><Badge status={goal.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 justify-end">
              <button className="btn btn-danger" onClick={() => setShowReturnModal(true)}>↩ Return for Rework</button>
              <button className="btn btn-primary" onClick={handleApprove} disabled={processing || (selectedEmp && totalW !== 100)}>
                {processing ? 'Processing...' : `✅ Approve ${empGoals.length} Goal(s)`}
              </button>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Return Goals for Rework">
        <ModalBody>
          <div className="form-group">
            <label className="form-label">Reason for Return *</label>
            <textarea className="form-textarea" rows={4} placeholder="Explain what needs to be revised..."
              value={returnReason} onChange={e => setReturnReason(e.target.value)} />
          </div>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-outline" onClick={() => setShowReturnModal(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleReturn} disabled={processing}>
            {processing ? 'Returning...' : '↩ Return Goals'}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
