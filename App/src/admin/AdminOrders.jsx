import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtPrice, fmtDate } from '../api.js';
import { StatusBadge, Spinner, Empty, usePoll } from '../components.jsx';
import { IconReceipt } from '../icons.jsx';

const FILTERS = ['all', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('all');

  usePoll(async () => {
    try {
      const d = await api('/admin/orders');
      setOrders(d.orders);
    } catch {
      /* retried on next poll */
    }
  }, 12000);

  if (orders === null) return <Spinner />;

  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const countFor = (f) => (f === 'all' ? orders.length : orders.filter((o) => o.status === f).length);

  return (
    <>
      <div className="admin-head">
        <div className="flex-1">
          <h1>Orders</h1>
          <div className="text-muted text-sm">{orders.length} in the last 100</div>
        </div>
      </div>

      <div className="chip-row" style={{ paddingInline: 0, marginBottom: 13 }}>
        {FILTERS.map((f) => (
          <button key={f} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f} <span className="count">{countFor(f)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <Empty icon={<IconReceipt size={28} />} title="No orders here" sub="New orders will show up in this list." />
      )}

      <div className="row-list">
        {shown.map((o) => (
          <Link key={o.id} to={`/admin/orders/${o.id}`} className="row-item clickable">
            <div className="flex-1">
              <div className="ri-title">
                #{o.number} · {o.customerName}
              </div>
              <div className="ri-sub">
                {fmtDate(o.createdAt)} · {o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
              </div>
            </div>
            <div className="ri-end">
              <span style={{ fontWeight: 800 }}>{fmtPrice(o.totalCents)}</span>
              <StatusBadge status={o.status} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
