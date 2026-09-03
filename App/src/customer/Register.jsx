import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store.jsx';
import { Logo } from '../icons.jsx';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      nav('/', { replace: true });
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
          <h1>Create account</h1>
          <p style={{ marginTop: 4 }}>Order in a couple of taps</p>
        </div>
      </div>

      <form className="auth-card" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <label className="field">
          <span>Full name</span>
          <input className="input" required minLength={2} placeholder="Alex Smith" value={form.name} onChange={set('name')} />
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} />
        </label>
        <label className="field">
          <span>Phone (optional)</span>
          <input className="input" type="tel" placeholder="555-0100" value={form.phone} onChange={set('phone')} />
        </label>
        <label className="field">
          <span>Password (min 6 characters)</span>
          <input className="input" type="password" required minLength={6} placeholder="••••••••" value={form.password} onChange={set('password')} />
        </label>
        <button className="btn btn-brand btn-block" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <div className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </div>
    </div>
  );
}
