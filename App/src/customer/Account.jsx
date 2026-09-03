import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store.jsx';
import { api } from '../api.js';
import { toast } from '../toast.jsx';
import { IconLogout, IconUser, IconGear } from '../icons.jsx';

export default function Account() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ current: '', next: '' });
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function changePassword(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/auth/password', { method: 'POST', body: form });
      toast('Password updated', 'success');
      setForm({ current: '', next: '' });
      setShowPw(false);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  function doLogout() {
    logout();
    nav('/login');
  }

  return (
    <>
      <header className="page-head">
        <h1>Account</h1>
      </header>

      <div className="page" style={{ paddingTop: 4 }}>
        <div className="card flex" style={{ gap: 14, padding: 18 }}>
          <div
            className="logo"
            style={{ width: 54, height: 54, borderRadius: 18, fontSize: 20, fontWeight: 800 }}
          >
            {user.name.trim().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div style={{ fontWeight: 700, fontSize: 16.5 }}>{user.name}</div>
            <div className="text-muted text-sm">{user.email}</div>
            {user.phone && <div className="text-faint text-sm">{user.phone}</div>}
          </div>
        </div>

        <div className="card mt-12">
          <button
            className="flex-between"
            style={{ width: '100%' }}
            onClick={() => setShowPw((v) => !v)}
          >
            <span className="flex" style={{ fontWeight: 650 }}>
              <IconGear size={19} /> Change password
            </span>
            <span className="text-faint">{showPw ? 'Hide' : 'Edit'}</span>
          </button>
          {showPw && (
            <form onSubmit={changePassword} className="mt-16">
              <label className="field">
                <span>Current password</span>
                <input
                  className="input"
                  type="password"
                  required
                  value={form.current}
                  onChange={(e) => setForm({ ...form, current: e.target.value })}
                />
              </label>
              <label className="field">
                <span>New password (min 6 chars)</span>
                <input
                  className="input"
                  type="password"
                  required
                  minLength={6}
                  value={form.next}
                  onChange={(e) => setForm({ ...form, next: e.target.value })}
                />
              </label>
              <button className="btn btn-brand btn-sm" disabled={busy}>
                {busy ? 'Saving…' : 'Save new password'}
              </button>
            </form>
          )}
        </div>

        <div className="card mt-12" style={{ padding: 14 }}>
          <div className="flex-between">
            <span className="text-muted text-sm">Member since</span>
            <span className="text-sm">{new Date(user.createdAt || Date.now()).getFullYear() || ''}</span>
          </div>
        </div>

        <button className="btn btn-danger btn-block mt-16" onClick={doLogout}>
          <IconLogout size={18} /> Log out
        </button>

        <p className="text-faint text-sm" style={{ textAlign: 'center', marginTop: 18 }}>
          Burger House · v1.0
        </p>
      </div>
    </>
  );
}
