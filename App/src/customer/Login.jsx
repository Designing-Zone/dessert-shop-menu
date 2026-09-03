import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store.jsx';
import { Logo, IconFlame } from '../icons.jsx';

/**
 * Shared login form. `admin` mode blocks non-admin accounts and
 * is used for the /admin/login page.
 */
export function LoginForm({ admin = false }) {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      if (admin && u.role !== 'admin') {
        setError('This account does not have admin access.');
        return;
      }
      const from = location.state?.from;
      nav(u.role === 'admin' ? '/admin' : from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Logo size={58} />
        <div>
          <h1>{admin ? 'Admin Panel' : 'Welcome back'}</h1>
          <p style={{ marginTop: 4 }}>
            {admin ? 'Burger House staff access' : 'Log in to order faster'}
          </p>
        </div>
      </div>

      <form className="auth-card" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <label className="field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="btn btn-brand btn-block" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      {!admin && (
        <div className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </div>
      )}
      {admin && (
        <div className="auth-switch">
          Not staff? <Link to="/">Back to the app</Link>
        </div>
      )}
    </div>
  );
}

export default function Login() {
  return <LoginForm />;
}
