import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../store.jsx';
import { api, fmtPrice } from '../api.js';
import { toast } from '../toast.jsx';
import { Stepper, Empty, Thumb } from '../components.jsx';
import { IconBag, IconTrash } from '../icons.jsx';

export default function Cart() {
  const { items, total, setCartQty, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const nav = useNavigate();

  if (!items.length && !placing) {
    return (
      <Empty
        icon={<IconBag size={30} />}
        title="Your cart is empty"
        sub="Add something delicious from the menu."
      >
        <button className="btn btn-brand" onClick={() => nav('/menu')}>
          Browse the menu
        </button>
      </Empty>
    );
  }

  async function placeOrder() {
    if (!user) {
      nav('/login', { state: { from: '/cart' } });
      return;
    }
    setPlacing(true);
    try {
      const d = await api('/orders', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          note,
        },
      });
      clearCart();
      toast('Order placed!', 'success');
      nav(`/orders/${d.order.id}`, { state: { placed: true } });
    } catch (e) {
      toast(e.message, 'error');
      setPlacing(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <h1>Your cart</h1>
      </header>

      <div className="page" style={{ paddingTop: 6 }}>
        <div className="card" style={{ padding: '4px 16px' }}>
          {items.map((i) => (
            <div className="cart-item" key={i.productId}>
              <Thumb product={i.product} />
              <div className="ci-body">
                <div className="ci-name">{i.product.name}</div>
                <div className="ci-price">{fmtPrice(i.product.priceCents)} each</div>
              </div>
              <div className="ci-end">
                <Stepper value={i.qty} min={0} max={99} onChange={(q) => setCartQty(i.productId, q)} />
                <span className="ci-total">{fmtPrice(i.product.priceCents * i.qty)}</span>
              </div>
              <button
                className="btn-icon danger"
                style={{ width: 34, height: 34 }}
                aria-label={`Remove ${i.product.name}`}
                onClick={() => removeFromCart(i.productId)}
              >
                <IconTrash size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="card mt-12">
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Note for the kitchen (optional)</span>
            <textarea
              className="input"
              style={{ minHeight: 64 }}
              placeholder="e.g. no onions, extra sauce…"
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        <div className="card mt-12">
          <div className="summary-row">
            <span>Items</span>
            <span>{items.reduce((s, i) => s + i.qty, 0)}</span>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{fmtPrice(total)}</span>
          </div>
          <div className="summary-row">
            <span>Pickup</span>
            <span>Free</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{fmtPrice(total)}</span>
          </div>
        </div>

        <button className="btn btn-brand btn-block mt-16" onClick={placeOrder} disabled={placing}>
          {placing ? 'Placing order…' : user ? 'Place order' : 'Log in to place order'}
        </button>
        <p className="text-faint text-sm" style={{ textAlign: 'center', marginTop: 10 }}>
          Pay at pickup{user ? ` · as ${user.name}` : ''}
        </p>
      </div>
    </>
  );
}
