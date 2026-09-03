import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, assetUrl } from '../api.js';
import { resizeImage } from '../imgResize.js';
import { toast } from '../toast.jsx';
import { ConfirmBtn, Spinner } from '../components.jsx';
import { IconCamera, IconChevronLeft, IconTrash } from '../icons.jsx';

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    image: '',
    available: true,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api('/admin/categories').then((d) => {
      setCategories(d.categories);
      if (!isEdit) {
        setForm((f) => ({ ...f, categoryId: f.categoryId || String(d.categories[0]?.id || '') }));
      }
    });
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    api('/admin/products')
      .then((d) => {
        const p = d.products.find((x) => String(x.id) === id);
        if (!p) {
          toast('Product not found', 'error');
          nav('/admin/products', { replace: true });
          return;
        }
        setForm({
          name: p.name,
          description: p.description,
          price: (p.priceCents / 100).toFixed(2),
          categoryId: String(p.categoryId),
          image: p.image,
          available: Boolean(p.available),
        });
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, nav]);

  async function pickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const small = await resizeImage(file);
      const fd = new FormData();
      fd.append('image', small);
      const d = await api('/admin/upload', { method: 'POST', formData: fd });
      setForm((f) => ({ ...f, image: d.url }));
      toast('Image ready', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(form.price.replace(',', '.')) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      toast('Please enter a valid price.', 'error');
      return;
    }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      priceCents,
      categoryId: Number(form.categoryId),
      image: form.image,
      available: form.available,
    };
    try {
      if (isEdit) {
        await api(`/admin/products/${id}`, { method: 'PATCH', body });
        toast('Product updated', 'success');
      } else {
        await api('/admin/products', { method: 'POST', body });
        toast('Product added', 'success');
      }
      nav('/admin/products');
    } catch (err) {
      toast(err.message, 'error');
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api(`/admin/products/${id}`, { method: 'DELETE' });
      toast('Product deleted', 'success');
      nav('/admin/products');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (loading) return <Spinner />;

  return (
    <>
      <div className="admin-head">
        <Link to="/admin/products" className="btn-icon" aria-label="Back to products">
          <IconChevronLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1>{isEdit ? 'Edit product' : 'New product'}</h1>
        </div>
      </div>

      <form onSubmit={save} style={{ maxWidth: 640 }}>
        <div className="card">
          <div className="img-picker">
            <div className="preview">
              {form.image ? (
                <img src={assetUrl(form.image)} alt="Product preview" />
              ) : (
                <IconCamera size={26} />
              )}
            </div>
            <div>
              <div className="flex" style={{ gap: 8 }}>
                <button type="button" className="btn btn-dark btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Uploading…' : form.image ? 'Change image' : 'Upload image'}
                </button>
                {form.image && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setForm((f) => ({ ...f, image: '' }))}>
                    Remove
                  </button>
                )}
              </div>
              <p className="hint">Photos are resized automatically (max 900px, JPEG).</p>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
            </div>
          </div>

          <label className="field">
            <span>Product name</span>
            <input
              className="input"
              required
              minLength={2}
              maxLength={80}
              placeholder="e.g. Double Smash Burger"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Category</span>
            <select
              className="input"
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji ? c.emoji + ' ' : ''}
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Price (USD)</span>
            <input
              className="input"
              required
              inputMode="decimal"
              placeholder="8.99"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              style={{ maxWidth: 180 }}
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              className="input"
              maxLength={1000}
              placeholder="Short, tasty description…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <div className="flex-between">
            <span style={{ fontWeight: 650 }}>Available on the menu</span>
            <button
              type="button"
              className={`switch${form.available ? ' on' : ''}`}
              role="switch"
              aria-checked={form.available}
              onClick={() => setForm((f) => ({ ...f, available: !f.available }))}
            />
          </div>
        </div>

        <div className="flex mt-16" style={{ gap: 10 }}>
          <button className="btn btn-brand" style={{ flex: 1 }} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
          </button>
          <Link to="/admin/products" className="btn btn-dark">Cancel</Link>
        </div>

        {isEdit && (
          <ConfirmBtn
            className="btn btn-danger btn-block mt-12"
            onConfirm={remove}
            style={{ marginBottom: 30 }}
          >
            <IconTrash size={17} /> Delete product
          </ConfirmBtn>
        )}
      </form>
    </>
  );
}
