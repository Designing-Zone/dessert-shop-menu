import React, { useState } from 'react';
import { api } from '../api.js';
import { toast } from '../toast.jsx';
import { Spinner, ConfirmBtn, Empty } from '../components.jsx';
import { IconTag, IconPlus, IconEdit, IconCheck, IconX, IconTrash } from '../icons.jsx';

export default function Categories() {
  const [cats, setCats] = useState(null);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [editing, setEditing] = useState(null); // {id, name, emoji}
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const d = await api('/admin/categories');
      setCats(d.categories);
    } catch (e) {
      toast(e.message, 'error');
    }
  }
  if (cats === null) {
    load();
    return <Spinner />;
  }

  async function add(e) {
    e.preventDefault();
    if (newName.trim().length < 2) return toast('Name is too short.', 'error');
    setBusy(true);
    try {
      await api('/admin/categories', { method: 'POST', body: { name: newName.trim(), emoji: newEmoji.trim() } });
      setNewName('');
      setNewEmoji('');
      toast('Category added', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    setBusy(true);
    try {
      await api(`/admin/categories/${editing.id}`, {
        method: 'PATCH',
        body: { name: editing.name.trim(), emoji: editing.emoji.trim() },
      });
      toast('Category updated', 'success');
      setEditing(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(cat) {
    try {
      await api(`/admin/categories/${cat.id}`, { method: 'DELETE' });
      toast('Category deleted', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <div className="admin-head">
        <div className="flex-1">
          <h1>Categories</h1>
          <div className="text-muted text-sm">Organize the menu into sections</div>
        </div>
      </div>

      <form className="card flex" onSubmit={add} style={{ gap: 8, alignItems: 'stretch' }}>
        <input
          className="input emoji-input"
          placeholder="🍔"
          maxLength={4}
          value={newEmoji}
          onChange={(e) => setNewEmoji(e.target.value)}
          aria-label="Emoji"
        />
        <input
          className="input flex-1"
          placeholder="New category name…"
          maxLength={40}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn btn-brand btn-sm" disabled={busy} style={{ alignSelf: 'center' }}>
          <IconPlus size={16} /> Add
        </button>
      </form>

      <div className="row-list mt-12">
        {cats.map((c) => (
          <div key={c.id} className="row-item">
            {editing?.id === c.id ? (
              <>
                <input
                  className="input emoji-input"
                  maxLength={4}
                  value={editing.emoji}
                  onChange={(e) => setEditing({ ...editing, emoji: e.target.value })}
                  aria-label="Emoji"
                />
                <input
                  className="input flex-1"
                  value={editing.name}
                  maxLength={40}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
                <div className="ri-end">
                  <button className="btn-icon" onClick={saveEdit} disabled={busy} aria-label="Save">
                    <IconCheck size={16} />
                  </button>
                  <button className="btn-icon" onClick={() => setEditing(null)} aria-label="Cancel">
                    <IconX size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="ph" style={{ fontSize: 20 }}>{c.emoji || '🍽️'}</div>
                <div className="ri-body">
                  <div className="ri-title">{c.name}</div>
                  <div className="ri-sub">
                    {c.productCount} product{c.productCount === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="ri-end">
                  <button
                    className="btn-icon"
                    style={{ width: 36, height: 36 }}
                    onClick={() => setEditing({ id: c.id, name: c.name, emoji: c.emoji })}
                    aria-label={`Edit ${c.name}`}
                  >
                    <IconEdit size={16} />
                  </button>
                  <ConfirmBtn
                    className="btn-icon danger"
                    style={{ width: 36, height: 36, fontSize: 0 }}
                    onConfirm={() => remove(c)}
                    aria-label={`Delete ${c.name}`}
                    title="Delete category"
                  >
                    <IconTrash size={16} />
                  </ConfirmBtn>
                </div>
              </>
            )}
          </div>
        ))}
        {cats.length === 0 && (
          <Empty icon={<IconTag size={28} />} title="No categories" sub="Add your first category above." />
        )}
      </div>
    </>
  );
}
