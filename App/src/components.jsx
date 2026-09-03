import React, { useEffect, useState } from 'react';
import { useCatalog, useCart } from './store.jsx';
import { fmtPrice, assetUrl } from './api.js';
import { IconPlus, IconMinus, IconX, IconCheck } from './icons.jsx';

/* ---------------------------------- bits ---------------------------------- */

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}

export function Empty({ icon, title, sub, children }) {
  return (
    <div className="empty">
      <div className="ico">{icon}</div>
      <h3>{title}</h3>
      {sub && <p>{sub}</p>}
      {children}
    </div>
  );
}

export function Thumb({ product, className = '' }) {
  const { categories } = useCatalog();
  const emoji =
    categories.find((c) => c.id === product.categoryId)?.emoji || '🍽️';
  return (
    <>
      {product.image ? (
        <img
          className={className}
          src={assetUrl(product.image)}
          alt={product.name}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className={`ph ${className}`}>{emoji}</div>
      )}
    </>
  );
}

/* ------------------------------ product pieces ----------------------------- */

export function ProductCard({ product, onOpen }) {
  const { addToCart } = useCart();
  const { categories } = useCatalog();
  const catName = categories.find((c) => c.id === product.categoryId)?.name || '';

  return (
    <div
      className={`product-card${product.available ? '' : ' unavailable'}`}
      onClick={() => onOpen(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(product)}
    >
      <div className="pc-img">
        {product.image ? (
          <img src={assetUrl(product.image)} alt={product.name} loading="lazy" decoding="async" />
        ) : (
          <ProductPh product={product} />
        )}
        {!product.available && <span className="sold-out">Sold out</span>}
      </div>
      <div className="pc-body">
        <span className="pc-name">{product.name}</span>
        <span className="pc-cat">{catName}</span>
        <div className="pc-foot">
          <span className="pc-price">{fmtPrice(product.priceCents)}</span>
          <button
            className="pc-add"
            aria-label={`Add ${product.name} to cart`}
            disabled={!product.available}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product.id, 1);
            }}
          >
            <IconPlus size={17} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductPh({ product }) {
  const { categories } = useCatalog();
  const emoji = categories.find((c) => c.id === product.categoryId)?.emoji || '🍔';
  return <div className="ph" style={{ fontSize: 34 }}>{emoji}</div>;
}

export function Stepper({ value, onChange, min = 1, max = 99 }) {
  return (
    <div className="stepper">
      <button
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <IconMinus size={16} strokeWidth={2.2} />
      </button>
      <span className="val">{value}</span>
      <button
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <IconPlus size={16} strokeWidth={2.2} />
      </button>
    </div>
  );
}

/** Bottom-sheet product detail with quantity picker. */
export function ProductSheet({ product, onClose }) {
  const { addToCart } = useCart();
  const { categories } = useCatalog();
  const [qty, setQty] = useState(1);
  const emoji = categories.find((c) => c.id === product.categoryId)?.emoji || '🍔';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={product.name}>
        <div className="sheet-grab" />
        <button className="btn-icon sheet-close" onClick={onClose} aria-label="Close">
          <IconX size={18} />
        </button>
        {product.image ? (
          <img className="sheet-img" src={assetUrl(product.image)} alt={product.name} />
        ) : (
          <div className="sheet-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
            {emoji}
          </div>
        )}
        <div className="sheet-body">
          <h2>{product.name}</h2>
          <div className="desc">{product.description || 'No description yet.'}</div>
          <div className="sheet-foot">
            <Stepper value={qty} onChange={setQty} />
            <button
              className="btn btn-brand"
              style={{ flex: 1 }}
              disabled={!product.available}
              onClick={() => {
                addToCart(product.id, qty);
                onClose();
              }}
            >
              {product.available
                ? `Add to cart · ${fmtPrice(product.priceCents * qty)}`
                : 'Sold out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small confirmation helper for destructive buttons. */
export function ConfirmBtn({ onConfirm, children, className = '', ...props }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 2500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      className={className}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      {...props}
    >
      {armed ? 'Tap again to confirm' : children}
    </button>
  );
}

/** Poll helper: calls fn immediately, then every `ms` while the tab is visible. */
export function usePoll(fn, ms) {
  useEffect(() => {
    fn();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') fn();
    }, ms);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export { IconCheck };
