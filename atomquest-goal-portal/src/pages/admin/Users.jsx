import { useState, useEffect } from 'react';
import { getAllUsers, updateUser, deleteUser } from '../../firebase/users';
import { registerUser } from '../../firebase/auth';
import { LoadingScreen, EmptyState } from '../../components/UI';
import { Modal, ModalBody, ModalFooter } from '../../components/Modal';
import toast from 'react-hot-toast';

const EMPTY = { name: '', email: '', password: '', role: 'employee', department: '', managerId: '' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const load = async () => { setLoading(true); const u = await getAllUsers(); setUsers(u); setLoading(false); };
  useEffect(() => { load(); }, []);

  const managers = users.filter(u => u.role === 'manager');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.id) {
      if (!form.email.trim()) e.email = 'Email required';
      if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
    }
    if (!form.role) e.role = 'Role required';
    if (!form.department.trim()) e.department = 'Department required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      if (form.id) {
        await updateUser(form.id, {
          name: form.name, role: form.role,
          department: form.department, managerId: form.managerId || null,
        });
        toast.success('User updated!');
      } else {
        await registerUser(form.email, form.password, {
          name: form.name, role: form.role,
          department: form.department, managerId: form.managerId || null,
        });
        toast.success('User created!');
      }
      setShowModal(false); setForm(EMPTY);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleRoleChange = async (uid, newRole) => {
    try { await updateUser(uid, { role: newRole }); toast.success('Role updated'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const handleManagerChange = async (uid, managerId) => {
    try { await updateUser(uid, { managerId: managerId || null }); toast.success('Manager updated'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (uid, name) => {
    if (!confirm(`Are you sure you want to completely remove ${name}? This cannot be undone.`)) return;
    try {
      await deleteUser(uid);
      toast.success('User removed successfully');
      load();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">User Management</h1><p className="page-subtitle">{users.length} total users</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
      </div>
      <div className="page-body">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Manager</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                        {u.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <span className="font-semibold">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-sm text-muted">{u.email}</td>
                  <td>
                    <select className="form-select" style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                      value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                      {['employee','manager','admin'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>{u.department}</td>
                  <td>
                    {u.role !== 'admin' ? (
                      <select className="form-select" style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                        value={u.managerId || ''} onChange={e => handleManagerChange(u.id, e.target.value)}>
                        <option value="">— No Manager —</option>
                        {managers.filter(m => m.id !== u.id).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    ) : (
                      <span className="text-muted text-sm">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-sm" onClick={() => { setForm({ id: u.id, name: u.name, email: u.email, role: u.role, department: u.department, managerId: u.managerId || '' }); setShowModal(true); }}>
                        Edit
                      </button>
                      {u.role !== 'admin' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.name)}>
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(EMPTY); setErrors({}); }} title={form.id ? "Edit User" : "Add New User"}>
        <ModalBody>
          <div className="flex flex-col gap-3">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" type="text" value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            {!form.id && (
              <>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" type="password" value={form.password || ''} onChange={e => set('password', e.target.value)} />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">Department *</label>
              <input className="form-input" type="text" value={form.department} onChange={e => set('department', e.target.value)} />
              {errors.department && <span className="form-error">{errors.department}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                {['employee','manager','admin'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {form.role !== 'admin' && (
              <div className="form-group">
                <label className="form-label">Assign Manager</label>
                <select className="form-select" value={form.managerId} onChange={e => set('managerId', e.target.value)}>
                  <option value="">— Select Manager —</option>
                  {managers.filter(m => m.id !== form.id).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (form.id ? 'Save Changes' : 'Create User')}</button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
