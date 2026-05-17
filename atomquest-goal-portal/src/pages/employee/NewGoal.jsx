import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createGoal, getGoalsByEmployee } from '../../firebase/goals';
import { WeightageBar, LoadingScreen } from '../../components/UI';
import { THRUST_AREAS, UOM_TYPES } from '../../firebase/seed';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const EMPTY = { thrustArea: '', title: '', description: '', uom: '', target: '', weightage: '' };

export default function NewGoal() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [existing, setExisting] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGoalsByEmployee(userData.id)
      .then(g => { setExisting(g); setLoading(false); })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load goals: ' + err.message);
        setLoading(false);
      });
  }, [userData.id]);

  const activeGoals = existing.filter(g => ['draft','submitted','approved'].includes(g.status));
  const totalUsed = activeGoals.reduce((s, g) => s + (Number(g.weightage) || 0), 0);
  const remaining = 100 - totalUsed;
  const preview = [...activeGoals, { ...form, weightage: Number(form.weightage) || 0, title: form.title || 'New Goal' }];

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.thrustArea) e.thrustArea = 'Select a thrust area';
    if (!form.title.trim()) e.title = 'Goal title is required';
    if (!form.uom) e.uom = 'Select unit of measurement';
    if (!form.target.trim()) e.target = 'Target is required';
    const w = Number(form.weightage);
    if (!form.weightage) e.weightage = 'Weightage is required';
    else if (w < 10) e.weightage = 'Minimum weightage is 10%';
    else if (totalUsed + w > 100) e.weightage = `Only ${remaining}% remaining`;
    if (activeGoals.length >= 8) e.title = 'Maximum 8 goals allowed';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await createGoal({ ...form, weightage: Number(form.weightage) }, userData.id);
      toast.success('Goal created successfully!');
      navigate('/employee/goals');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen />;

  const uomInfo = UOM_TYPES.find(u => u.value === form.uom);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Goal</h1>
          <p className="page-subtitle">{activeGoals.length}/8 goals · {totalUsed}% used · {remaining}% remaining</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={() => navigate('/employee/goals')}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || activeGoals.length >= 8}>
            {saving ? 'Saving...' : '💾 Save Goal'}
          </button>
        </div>
      </div>
      <div className="page-body">
        {activeGoals.length >= 8 && <div className="alert alert-error mb-4">Maximum 8 goals reached.</div>}
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <h2 className="section-title">Goal Details</h2>
            <div className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Thrust Area *</label>
                <select className="form-select" value={form.thrustArea} onChange={e => set('thrustArea', e.target.value)}>
                  <option value="">Select...</option>
                  {THRUST_AREAS.map(t => <option key={t}>{t}</option>)}
                </select>
                {errors.thrustArea && <span className="form-error">{errors.thrustArea}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Goal Title *</label>
                <input className="form-input" placeholder="e.g., Increase Sales Revenue" value={form.title} onChange={e => set('title', e.target.value)} />
                {errors.title && <span className="form-error">{errors.title}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Describe the goal..." value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit of Measurement (UoM) *</label>
                <select className="form-select" value={form.uom} onChange={e => set('uom', e.target.value)}>
                  <option value="">Select UoM...</option>
                  {UOM_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
                {errors.uom && <span className="form-error">{errors.uom}</span>}
                {uomInfo && <span className="form-hint">📌 {uomInfo.description}</span>}
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Target *</label>
                  <input className="form-input" type={form.uom === 'timeline' ? 'date' : 'text'}
                    placeholder={form.uom === 'zero' ? '0' : 'Enter target value'}
                    value={form.target} onChange={e => set('target', e.target.value)} />
                  {errors.target && <span className="form-error">{errors.target}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Weightage (%) *</label>
                  <input className="form-input" type="number" min="10" max={remaining} step="5"
                    placeholder={`Min 10%, max ${remaining}%`}
                    value={form.weightage} onChange={e => set('weightage', e.target.value)} />
                  {errors.weightage && <span className="form-error">{errors.weightage}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="card">
              <h2 className="section-title">Weightage Preview</h2>
              <WeightageBar goals={preview} />
            </div>
            <div className="card">
              <h2 className="section-title">Validation Checklist</h2>
              {[
                { ok: activeGoals.length < 8, label: `Max 8 goals (${activeGoals.length} current)` },
                { ok: !form.weightage || Number(form.weightage) >= 10, label: 'Min 10% weightage per goal' },
                { ok: totalUsed + Number(form.weightage||0) <= 100, label: `Total ≤ 100% (${totalUsed + Number(form.weightage||0)}% now)` },
                { ok: !!form.thrustArea, label: 'Thrust area selected' },
                { ok: !!form.uom, label: 'UoM type selected' },
              ].map((r, i) => (
                <div key={i} className="flex gap-2 items-center text-sm mb-2">
                  <span style={{ color: r.ok ? 'var(--success)' : 'var(--error)', fontWeight: 700 }}>{r.ok ? '✓' : '✗'}</span>
                  <span style={{ color: r.ok ? 'var(--text-muted)' : 'var(--error)' }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
