import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCatalog } from '../store.jsx';
import { ProductCard, ProductSheet, Spinner, Empty } from '../components.jsx';

export default function MenuPage() {
  const { categories, products, loading, refreshCatalog } = useCatalog();
  const [selected, setSelected] = useState('all');
  const [open, setOpen] = useState(null);
  const location = useLocation();

  // deep-link like /menu#3 selects that category
  useEffect(() => {
    if (location.hash) {
      const id = Number(location.hash.slice(1));
      if (categories.some((c) => c.id === id)) setSelected(id);
    }
  }, [location.hash, categories]);

  useEffect(() => {
    document.title = 'Menu · Burger House';
  }, []);

  const visible = useMemo(() => {
    const list = selected === 'all' ? products : products.filter((p) => p.categoryId === selected);
    // group by category preserving category order
    return categories
      .filter((c) => selected === 'all' || c.id === selected)
      .map((c) => ({ cat: c, items: list.filter((p) => p.categoryId === c.id) }))
      .filter((g) => g.items.length > 0);
  }, [products, categories, selected]);

  if (loading && products.length === 0) return <Spinner />;

  return (
    <>
      <header className="page-head">
        <div className="flex-1">
          <h1>Menu</h1>
          <div className="sub">{products.length} items · fresh every day</div>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => refreshCatalog(false)} style={{ color: 'var(--brand)', fontWeight: 700 }}>
          Refresh
        </button>
      </header>

      <div className="chip-row" style={{ position: 'sticky', top: 62, zIndex: 25, background: 'linear-gradient(rgba(19,17,16,.95), rgba(19,17,16,.85))', backdropFilter: 'blur(8px)', paddingBottom: 10 }}>
        <button className={`chip${selected === 'all' ? ' active' : ''}`} onClick={() => setSelected('all')}>
          All <span className="count">{products.length}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`chip${selected === c.id ? ' active' : ''}`}
            onClick={() => setSelected(c.id)}
          >
            <span className="emoji">{c.emoji}</span> {c.name}
            <span className="count">{c.product_count}</span>
          </button>
        ))}
      </div>

      <div className="page" style={{ paddingTop: 10 }}>
        {visible.length === 0 && (
          <Empty icon="🍔" title="Nothing here yet" sub="Check back soon — the kitchen is working on it." />
        )}
        {visible.map((g) => (
          <section className="section" key={g.cat.id} style={{ marginTop: 14 }}>
            <div className="section-head">
              <h2>
                {g.cat.emoji} {g.cat.name}
              </h2>
            </div>
            <div className="product-grid">
              {g.items.map((p) => (
                <ProductCard key={p.id} product={p} onOpen={setOpen} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {open && <ProductSheet product={open} onClose={() => setOpen(null)} />}
    </>
  );
}
