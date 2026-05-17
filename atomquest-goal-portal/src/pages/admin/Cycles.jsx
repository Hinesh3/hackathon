import { useState, useEffect } from 'react';
import { getAllCycles, createCycle, updateCycle } from '../../firebase/users';
import { LoadingScreen } from '../../components/UI';
import toast from 'react-hot-toast';

const PHASES = ['goal_setting','Q1','Q2','Q3','Q4'];
const EMPTY = { year: new Date().getFullYear(), currentPhase: 'goal_setting', goalSettingOpen: '', goalSettingClose: '', q1Open: '', q1Close: '', q2Open: '', q2Close: '', q3Open: '', q3Close: '', q4Open: '', q4Close: '', isActive: true };

export default function Cycles() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); const c = await getAllCycles(); setCycles(c); setLoading(false); };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) { await updateCycle(editId, form); toast.success('Cycle updated!'); }
      else { await createCycle(form); toast.success('Cycle created!'); }
      setEditId(null); setForm(EMPTY); load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (c) => { setEditId(c.id); setForm({ year: c.year, currentPhase: c.currentPhase, goalSettingOpen: c.goalSettingOpen||'', goalSettingClose: c.goalSettingClose||'', q1Open: c.q1Open||'', q1Close: c.q1Close||'', q2Open: c.q2Open||'', q2Close: c.q2Close||'', q3Open: c.q3Open||'', q3Close: c.q3Close||'', q4Open: c.q4Open||'', q4Close: c.q4Close||'', isActive: c.isActive }); };

  if (loading) return <LoadingScreen />;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">Cycle Management</h1><p className="page-subtitle">Configure goal-setting and check-in windows</p></div>
      </div>
      <div className="page-body">
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          {/* Form */}
          <div className="card">
            <h2 className="section-title">{editId ? 'Edit Cycle' : 'Create New Cycle'}</h2>
            <div className="flex flex-col gap-3">
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input className="form-input" type="number" value={form.year} onChange={e => set('year', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Phase</label>
                  <select className="form-select" value={form.currentPhase} onChange={e => set('currentPhase', e.target.value)}>
                    {PHASES.map(p => <option key={p} value={p}>{p.replace('_', ' ').toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              {[
                ['Goal Setting', 'goalSettingOpen', 'goalSettingClose'],
                ['Q1 Check-in', 'q1Open', 'q1Close'],
                ['Q2 Check-in', 'q2Open', 'q2Close'],
                ['Q3 Check-in', 'q3Open', 'q3Close'],
                ['Q4 / Annual', 'q4Open', 'q4Close'],
              ].map(([label, openKey, closeKey]) => (
                <div key={label}>
                  <div className="form-label mb-1">{label}</div>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Opens</label>
                      <input className="form-input" type="date" value={form[openKey]} onChange={e => set(openKey, e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Closes</label>
                      <input className="form-input" type="date" value={form[closeKey]} onChange={e => set(closeKey, e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 mt-2">
                {editId && <button className="btn btn-outline" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
                <button className="btn btn-primary w-full" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : editId ? 'Update Cycle' : 'Create Cycle'}
                </button>
              </div>
            </div>
          </div>

          {/* Existing cycles */}
          <div className="flex flex-col gap-4">
            <h2 className="section-title">Existing Cycles</h2>
            {cycles.map(c => (
              <div key={c.id} className={`card ${c.isActive ? 'card-glow' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold" style={{ fontSize: '1.1rem' }}>Cycle {c.year}</div>
                    {c.isActive && <span className="badge badge-green">Active</span>}
                  </div>
                  <div className="flex gap-2">
                    <span className="badge badge-teal">{c.currentPhase?.replace('_',' ').toUpperCase()}</span>
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                  </div>
                </div>
                <div className="flex flex-col gap-1" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {[['Goal Setting', c.goalSettingOpen, c.goalSettingClose],['Q1', c.q1Open, c.q1Close],['Q2', c.q2Open, c.q2Close],['Q3', c.q3Open, c.q3Close],['Q4', c.q4Open, c.q4Close]].map(([l, o, cl]) => o && (
                    <div key={l} className="flex justify-between">
                      <span>{l}:</span><span>{o} → {cl}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {cycles.length === 0 && <div className="alert alert-info">No cycles created yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
