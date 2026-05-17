import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleLogin = async (e, overrideEmail, overridePassword) => {
    e?.preventDefault();
    const em = overrideEmail || email;
    const pw = overridePassword || password;
    if (!em || !pw) { setError('Please enter email and password'); return; }
    setLoading(true); setError('');
    try {
      await login(em, pw);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Demo accounts not found. Click "Setup Demo" to initialize.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally { setLoading(false); }
  };


  return (
    <div className="login-page">
      <div className="login-card animate-slide">
        <div className="login-header">
          <div className="login-logo">PE</div>
          <h1 className="login-title">PerformEdge</h1>
          <p className="login-sub">Goal Setting & Tracking Portal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </div>
        </form>


      </div>
    </div>
  );
}
