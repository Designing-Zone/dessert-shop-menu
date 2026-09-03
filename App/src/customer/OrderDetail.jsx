import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { api, fmtDateLong, fmtPrice } from '../api.js';
import { StatusBadge, Spinner, Empty, usePoll } from '../components.jsx';
import { IconCheck, IconAlert } from '../icons.jsx';

const STEPS = [
  { key: 'pending', label: 'Order received', sub: 'The restaurant got your order.' },
  { key: 'preparing', label: 'Preparing', sub: 'The kitchen is cooking it now.' },
  { key: 'ready', label: 'Ready', sub: 'Waiting for pickup.' },
  { key: 'delivered', label: 'Delivered', sub: 'Enjoy your meal!' },
];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(undefined);
  const location = useLocation();
  const justPlaced = Boolean(location.state?.placed);

  usePoll(async () => {
    try {
      const d = await api(`/orders/${id}`);
      setOrder(d.order);
    } catch {
      if (order === undefined) setOrder(null);
    }
  }, 10000);

  if (order === undefined) return <Spinner />;
  if (order === null)
    return <Empty icon={<IconAlert size={30} />} title="Order not found" />;

  const cancelled = order.status === 'cancelled';
  const currentIdx = STEPS.findIndex((s) => s.key === order.status);

  return (
    <>
      <header className="page-head">
        <h1>Order #{order.number}</h1>
        <StatusBadge status={order.status} />
      </header>

      <div className="page" style={{ paddingTop: 4 }}>
        {justPlaced && (
          <div className="banner ok">
            <IconCheck size={19} /> Order placed — the restaurant received it!
          </div>
        )}

        <div className="card">
          {cancelled ? (
            <>
              <div className="banner danger" style={{ marginBottom: 6 }}>
                <IconAlert size={19} /> This order was cancelled.
              </div>
              <p className="text-muted text-sm">
                If you paid already, contact the restaurant for a refund.
              </p>
            </>
          ) : (
            <div className="timeline">
              {STEPS.map((s, idx) => {
                const done = idx < currentIdx;
                const current = idx === currentIdx;
                return (
                  <div
                    key={s.key}
                    className={`tl-step${done ? ' done' : ''}${current ? ' current' : ''}`}
                  >
                    <div className="tl-dot">
                      {done ? <IconCheck size={14} strokeWidth={2.6} /> : idx + 1}
                    </div>
                    <div>
                      <div className="tl-label">{s.label}</div>
                      <div className="tl-sub">{current ? s.sub : done ? 'Done' : ' '}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card mt-12">
          {order.items.map((i) => (
            <div className="cart-item" key={i.id}>
              <div className="stepper" style={{ opacity: 0.9 }}>
                <span className="val">{i.qty}×</span>
              </div>
              <div className="ci-body">
                <div className="ci-name">{i.name}</div>
                <div className="ci-price">{fmtPrice(i.priceCents)} each</div>
              </div>
              <span className="ci-total">{fmtPrice(i.priceCents * i.qty)}</span>
            </div>
          ))}
          <div className="summary-row total mt-8" style={{ borderTop: 'none' }}>
            <span>Total</span>
            <span>{fmtPrice(order.totalCents)}</span>
          </div>
        </div>

        <div className="card mt-12">
          <div className="kv">
            <span className="k">Ordered</span>
            <span className="v">{fmtDateLong(order.createdAt)}</span>
          </div>
          <div className="kv">
            <span className="k">Pickup</span>
            <span className="v">At the restaurant</span>
          </div>
          {order.note && (
            <div className="kv">
              <span className="k">Note</span>
              <span className="v">{order.note}</span>
            </div>
          )}
        </div>

        <Link to="/menu" className="btn btn-dark btn-block mt-16">
          Order something else
        </Link>
      </div>
    </>
  );
}
