import { useState, useEffect } from 'react';
import { getAuditLogs } from '../../firebase/audit';
import { LoadingScreen } from '../../components/UI';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAuditLogs().then(l => { setLogs(l); setLoading(false); });
  }, []);

  const filtered = logs.filter(l =>
    !search || l.userName?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.field?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-IN');
  };

  const actionColor = { approved: 'var(--success)', returned: 'var(--error)', update: 'var(--warning)', create: 'var(--info)' };

  if (loading) return <LoadingScreen />;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">Audit Log</h1><p className="page-subtitle">All goal changes after lock date</p></div>
      </div>
      <div className="page-body">
        <div className="card mb-4">
          <input className="form-input" placeholder="Search by user, action, or field..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <div className="alert alert-info">No audit logs found.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Field</th><th>Old Value</th><th>New Value</th></tr></thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id}>
                    <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>{formatTime(log.timestamp)}</td>
                    <td className="font-semibold">{log.userName || '—'}</td>
                    <td>
                      <span className="badge" style={{ background: `${actionColor[log.action] || 'var(--text-dim)'}20`, color: actionColor[log.action] || 'var(--text-muted)', border: `1px solid ${actionColor[log.action] || 'var(--border)'}40` }}>
                        {log.action}
                      </span>
                    </td>
                    <td className="text-sm">{log.field || '—'}</td>
                    <td className="text-sm" style={{ color: 'var(--error)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.oldValue || '—'}</td>
                    <td className="text-sm" style={{ color: 'var(--success)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.newValue || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-sm text-muted mt-4">{filtered.length} entries</div>
      </div>
    </div>
  );
}
