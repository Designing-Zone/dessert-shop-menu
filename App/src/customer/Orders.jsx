import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, fmtDate, fmtPrice } from '../api.js';
import { StatusBadge, Empty, Spinner, usePoll } from '../components.jsx';
import { IconReceipt } from '../icons.jsx';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const nav = useNavigate();

  usePoll(async () => {
    try {
      const d = await api('/orders');
      setOrders(d.orders);
    } catch {
      /* keep showing what we have */
    }
  }, 15000);

  if (orders === null) return <Spinner />;

  return (
    <>
      <header className="page-head">
        <h1>My orders</h1>
      </header>
      <div className="page" style={{ paddingTop: 4 }}>
        {orders.length === 0 && (
          <Empty icon={<IconReceipt size={30} />} title="No orders yet" sub="Your order history will appear here.">
            <button className="btn btn-brand" onClick={() => nav('/menu')}>
              Start an order
            </button>
          </Empty>
        )}
        {orders.map((o) => (
          <Link to={`/orders/${o.id}`} key={o.id} className="order-card">
            <div className="oc-top">
              <div>
                <div className="oc-num">#{o.number}</div>
                <div className="oc-date">{fmtDate(o.createdAt)}</div>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="oc-items">
              {o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
            </div>
            <div className="oc-bot">
              <span className="text-faint text-sm">{o.items.length} item{o.items.length > 1 ? 's' : ''}</span>
              <span className="oc-total">{fmtPrice(o.totalCents)}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
