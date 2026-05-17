import { useState, useEffect } from 'react';
import { getAllUsers } from '../../firebase/users';
import { pushSharedGoal } from '../../firebase/goals';
import { THRUST_AREAS, UOM_TYPES } from '../../firebase/seed';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen } from '../../components/UI';
import toast from 'react-hot-toast';

const EMPTY = { thrustArea: '', title: '', description: '', uom: '', target: '', weightage: '' };

export default function SharedGoals() {
  const { userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllUsers().then(u => { setUsers(u.filter(x => x.role === 'employee')); setLoading(false); });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleEmp = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === users.length ? [] : users.map(u => u.id));

  const handlePush = async () => {
    if (!form.thrustArea || !form.title || !form.uom || !form.target) { toast.error('Fill all required fields'); return; }
    if (!selected.length) { toast.error('Select at least one employee'); return; }
    const w = Number(form.weightage);
    if (!w || w < 10) { toast.error('Minimum weightage is 10%'); return; }
    setSaving(true);
    try {
      await pushSharedGoal({ ...form, weightage: w }, selected, userData.id);
      toast.success(`Shared goal pushed to ${selected.length} employee(s)!`);
      setForm(EMPTY); setSelected([]);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">Shared Goals</h1><p className="page-subtitle">Push departmental KPIs to multiple employees</p></div>
      </div>
      <div className="page-body">
        <div className="alert alert-info mb-6">
          🔗 Shared goals are pushed as <strong>read-only</strong> (Title + Target locked). Employees can only adjust their weightage.
        </div>
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <h2 className="section-title">Goal Configuration</h2>
            <div className="flex flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Thrust Area *</label>
                <select className="form-select" value={form.thrustArea} onChange={e => set('thrustArea', e.target.value)}>
                  <option value="">Select...</option>
                  {THRUST_AREAS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Goal Title * (read-only for recipients)</label>
                <input className="form-input" placeholder="e.g., Reduce Customer Complaints by 20%" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">UoM *</label>
                <select className="form-select" value={form.uom} onChange={e => set('uom', e.target.value)}>
                  <option value="">Select UoM...</option>
                  {UOM_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Target * (read-only)</label>
                  <input className="form-input" placeholder="e.g., 20" value={form.target} onChange={e => set('target', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Weightage %</label>
                  <input className="form-input" type="number" min="10" placeholder="Min 10%" value={form.weightage} onChange={e => set('weightage', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title" style={{ marginBottom: 0 }}>Select Recipients</h2>
              <button className="btn btn-outline btn-sm" onClick={toggleAll}>
                {selected.length === users.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex flex-col gap-2" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {users.map(u => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', background: selected.includes(u.id) ? 'rgba(13,115,119,0.1)' : 'var(--surface)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: `1px solid ${selected.includes(u.id) ? 'var(--primary)' : 'var(--border)'}` }}>
                  <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleEmp(u.id)} />
                  <div>
                    <div className="font-semibold text-sm">{u.name}</div>
                    <div className="text-xs text-muted">{u.department}</div>
                  </div>
                </label>
              ))}
              {users.length === 0 && <div className="text-muted text-sm">No employees found.</div>}
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted mb-2">{selected.length} employee(s) selected</div>
              <button className="btn btn-primary w-full" onClick={handlePush} disabled={saving || !selected.length}>
                {saving ? 'Pushing...' : `🔗 Push to ${selected.length} Employee(s)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
