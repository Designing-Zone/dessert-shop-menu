import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCatalog } from '../store.jsx';
import { api, fmtPrice as fmt, assetUrl } from '../api.js';
import { ProductCard, ProductSheet, Spinner } from '../components.jsx';
import { Logo, IconFlame, IconChevronRight } from '../icons.jsx';

export default function Home() {
  const { user } = useAuth();
  const { categories, products, loading } = useCatalog();
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api('/info').then((d) => setInfo(d.info)).catch(() => {});
  }, []);

  const available = products.filter((p) => p.available);
  const offersCat = categories.find((c) => c.name === 'Offers');
  const offers = offersCat ? available.filter((p) => p.categoryId === offersCat.id) : [];
  const popular = available.slice(0, 4);

  if (loading && products.length === 0) return <Spinner />;

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <header className="home-top">
        <Logo size={42} />
        <div className="who">
          <div className="hi">{greeting}</div>
          <div className="name">{user ? user.name : info?.restaurant_name || 'Burger House'}</div>
        </div>
        <Link to="/menu" className="btn-icon" aria-label="Open menu">
          <IconFlame size={19} />
        </Link>
      </header>

      <section className="hero">
        <IconFlame size={170} className="flame" strokeWidth={1} />
        <h2>Flame-grilled. Always fresh.</h2>
        <p>{info?.restaurant_name || 'Burger House'} · Order ahead, skip the wait.</p>
        <button className="btn" onClick={() => nav('/menu')}>
          Browse the menu <IconChevronRight size={17} />
        </button>
      </section>

      <section className="section">
        <div className="section-head" style={{ paddingInline: 16 }}>
          <h2>Categories</h2>
          <Link className="more" to="/menu">See all</Link>
        </div>
        <div className="chip-row" style={{ paddingInline: 0 }}>
          {categories.map((c) => (
            <Link key={c.id} to={`/menu#${c.id}`} className="cat-card">
              <span className="emoji">{c.emoji || '🍽️'}</span>
              <span className="label">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {offers.length > 0 && (
        <section className="section">
          <div className="section-head" style={{ paddingInline: 16 }}>
            <h2>Hot deals 🔥</h2>
            <Link className="more" to="/menu#offers">See all</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingInline: 16 }}>
            {offers.map((p) => (
              <button key={p.id} className="offer-card" onClick={() => setOpen(p)}>
                <OfferThumb product={p} />
                <div className="oc-body">
                  <div className="oc-name">{p.name}</div>
                  <div className="oc-desc">{p.description}</div>
                  <div className="oc-foot">
                    <span className="pc-price">{fmt(p.priceCents)}</span>
                    <span className="badge badge-muted">Offer</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="section">
          <div className="section-head" style={{ paddingInline: 16 }}>
            <h2>Popular picks</h2>
            <Link className="more" to="/menu">See all</Link>
          </div>
          <div className="product-grid" style={{ paddingInline: 16 }}>
            {popular.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={setOpen} />
            ))}
          </div>
        </section>
      )}

      {open && <ProductSheet product={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function OfferThumb({ product }) {
  return product.image ? (
    <img src={assetUrl(product.image)} alt={product.name} loading="lazy" decoding="async" />
  ) : (
    <div className="ph">⭐</div>
  );
}
