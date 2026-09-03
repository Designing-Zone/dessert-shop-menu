import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtPrice, assetUrl } from '../api.js';
import { useCatalog } from '../store.jsx';
import { toast } from '../toast.jsx';
import { Spinner, Empty, usePoll } from '../components.jsx';
import { IconBox, IconEdit, IconSearch, IconPlus } from '../icons.jsx';

export default function Products() {
  const { categories, refreshCatalog } = useCatalog();
  const [products, setProducts] = useState(null);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  usePoll(async () => {
    try {
      const d = await api('/admin/products');
      setProducts(d.products);
    } catch {
      /* retried */
    }
  }, 25000);

  async function toggleAvailable(p) {
    const next = !p.available;
    setProducts((cur) => cur.map((x) => (x.id === p.id ? { ...x, available: next ? 1 : 0 } : x)));
    try {
      await api(`/admin/products/${p.id}`, { method: 'PATCH', body: { available: next } });
      refreshCatalog(); // customer menu should update too
    } catch (e) {
      setProducts((cur) => cur.map((x) => (x.id === p.id ? { ...x, available: p.available } : x)));
      toast(e.message, 'error');
    }
  }

  const shown = useMemo(() => {
    if (!products) return [];
    let list = filter === 'all' ? products : products.filter((p) => p.categoryId === filter);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(needle));
    }
    return list;
  }, [products, filter, q]);

  if (products === null) return <Spinner />;

  return (
    <>
      <div className="admin-head">
        <div className="flex-1">
          <h1>Products</h1>
          <div className="text-muted text-sm">{products.length} total</div>
        </div>
        <Link to="/admin/products/new" className="btn btn-brand btn-sm">
          <IconPlus size={16} /> Add product
        </Link>
      </div>

      <div className="searchbar">
        <IconSearch size={17} />
        <input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="chip-row" style={{ paddingInline: 0, marginBottom: 13 }}>
        <button className={`chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
        {categories.map((c) => (
          <button key={c.id} className={`chip${filter === c.id ? ' active' : ''}`} onClick={() => setFilter(c.id)}>
            <span className="emoji">{c.emoji}</span> {c.name}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <Empty icon={<IconBox size={28} />} title="No products found" sub="Try a different category or search.">
          <Link to="/admin/products/new" className="btn btn-brand">
            Add your first product
          </Link>
        </Empty>
      )}

      <div className="row-list">
        {shown.map((p) => (
          <div key={p.id} className="row-item">
            {p.image ? (
              <img className="thumb" src={assetUrl(p.image)} alt="" loading="lazy" />
            ) : (
              <div className="ph">🍔</div>
            )}
            <div className="ri-body">
              <div className="ri-title">{p.name}</div>
              <div className="ri-sub">
                {categories.find((c) => c.id === p.categoryId)?.name || 'Uncategorized'} · {fmtPrice(p.priceCents)}
              </div>
            </div>
            <div className="ri-end">
              <span className="text-faint" style={{ fontSize: 12 }}>
                {p.available ? 'Available' : 'Hidden'}
              </span>
              <button
                className={`switch${p.available ? ' on' : ''}`}
                role="switch"
                aria-checked={Boolean(p.available)}
                aria-label={`Toggle availability of ${p.name}`}
                onClick={() => toggleAvailable(p)}
              />
              <Link to={`/admin/products/${p.id}/edit`} className="btn-icon" style={{ width: 36, height: 36 }} aria-label={`Edit ${p.name}`}>
                <IconEdit size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
