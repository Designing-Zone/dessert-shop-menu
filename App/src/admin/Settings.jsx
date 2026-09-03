import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { toast } from '../toast.jsx';
import { Spinner } from '../components.jsx';
import { IconPin, IconPhone, IconGear } from '../icons.jsx';

export default function Settings() {
  const [info, setInfo] = useState(null);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api('/admin/settings').then((d) => setInfo(d.settings));
  }, []);

  if (!info) return <Spinner />;

  async function saveInfo(e) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      await api('/admin/settings', {
        method: 'PUT',
        body: {
          restaurant_name: info.restaurant_name,
          restaurant_phone: info.restaurant_phone,
          restaurant_address: info.restaurant_address,
        },
      });
      toast('Restaurant info saved', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingInfo(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setSavingPw(true);
    try {
      await api('/auth/password', { method: 'POST', body: pw });
      toast('Admin password updated', 'success');
      setPw({ current: '', next: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <>
      <div className="admin-head">
        <div className="flex-1">
          <h1>Settings</h1>
          <div className="text-muted text-sm">Restaurant info &amp; admin account</div>
        </div>
      </div>

      <div style={{ maxWidth: 640 }}>
        <form className="card" onSubmit={saveInfo}>
          <div className="flex" style={{ fontWeight: 650, marginBottom: 14 }}>
            <IconPin size={18} /> Restaurant info
          </div>
          <label className="field">
            <span>Restaurant name</span>
            <input
              className="input"
              required
              maxLength={60}
              value={info.restaurant_name || ''}
              onChange={(e) => setInfo({ ...info, restaurant_name: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Phone</span>
            <input
              className="input"
              maxLength={30}
              value={info.restaurant_phone || ''}
              onChange={(e) => setInfo({ ...info, restaurant_phone: e.target.value })}
            />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Address</span>
            <input
              className="input"
              maxLength={120}
              value={info.restaurant_address || ''}
              onChange={(e) => setInfo({ ...info, restaurant_address: e.target.value })}
            />
          </label>
          <button className="btn btn-brand btn-sm mt-16" disabled={savingInfo}>
            {savingInfo ? 'Saving…' : 'Save info'}
          </button>
          <p className="hint text-faint text-sm mt-8" style={{ marginTop: 8 }}>
            Shown on the customer app's home screen.
          </p>
        </form>

        <form className="card mt-12" onSubmit={changePassword}>
          <div className="flex" style={{ fontWeight: 650, marginBottom: 14 }}>
            <IconGear size={18} /> Admin password
          </div>
          <label className="field">
            <span>Current password</span>
            <input
              className="input"
              type="password"
              required
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
            />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>New password (min 6 chars)</span>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
            />
          </label>
          <button className="btn btn-brand btn-sm mt-16" disabled={savingPw}>
            {savingPw ? 'Saving…' : 'Update password'}
          </button>
          <p className="flex text-faint text-sm mt-8" style={{ marginTop: 8 }}>
            <IconPhone size={14} style={{ marginRight: 6 }} /> Keep it safe — this controls the whole menu.
          </p>
        </form>
      </div>
    </>
  );
}
