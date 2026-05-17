import { getStatusBadgeClass, getStatusLabel, getScoreColor, computeScore } from '../utils/scoring';

export function Badge({ status }) {
  return (
    <span className={`badge ${getStatusBadgeClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export function ScoreRing({ score, size = 64 }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const fill = score !== null ? (circ - (circ * (score / 100))) : circ;
  const color = getScoreColor(score);
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={fill}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="score-text" style={{ color }}>
        {score !== null ? `${Math.round(score)}%` : '—'}
      </div>
    </div>
  );
}

export function WeightageBar({ goals }) {
  const total = goals.reduce((s, g) => s + (Number(g.weightage) || 0), 0);
  const ok = total === 100;
  const colors = ['#0D7377','#F5A623','#10B981','#3B82F6','#F43F5E','#8B5CF6','#EC4899','#14B8A6'];
  return (
    <div className="weightage-display">
      <div className="weightage-segments">
        {goals.map((g, i) => (
          <div
            key={i}
            className="weightage-segment"
            style={{ width: `${g.weightage || 0}%`, background: colors[i % colors.length], minWidth: g.weightage > 0 ? 4 : 0 }}
            title={`${g.title}: ${g.weightage}%`}
          />
        ))}
        {total < 100 && (
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '999px' }} />
        )}
      </div>
      <div className="weightage-info">
        <span className="text-sm text-muted">{goals.length} goal{goals.length !== 1 ? 's' : ''}</span>
        <span className={`font-bold text-sm ${ok ? 'weightage-ok' : 'weightage-warn'}`}>
          {total}% / 100% {ok ? '✓' : '⚠'}
        </span>
      </div>
    </div>
  );
}

export function Spinner({ size = 'md' }) {
  return <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />;
}

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner spinner-lg" />
      <p className="text-muted">Loading...</p>
    </div>
  );
}

export function EmptyState({ icon = '📭', title, desc, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {desc && <p className="empty-desc">{desc}</p>}
      {action && <div style={{ marginTop: '1.5rem' }}>{action}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, color = 'var(--primary)', change }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}20`, fontSize: '1.5rem' }}>{icon}</div>
      <div>
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
        {change && <div className="stat-change text-muted">{change}</div>}
      </div>
    </div>
  );
}
