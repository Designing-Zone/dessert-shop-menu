import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, fmtPrice, fmtDateLong } from '../api.js';
import { StatusBadge, Spinner, Empty, usePoll } from '../components.jsx';
import { toast } from '../toast.jsx';
import { IconAlert, IconUser, IconPhone, IconReceipt } from '../icons.jsx';

const STATUSES = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(undefined);
  const [saving, setSaving] = useState(false);

  usePoll(async () => {
    try {
      const d = await api(`/admin/orders/${id}`);
      setOrder(d.order);
    } catch {
      if (order === undefined) setOrder(null);
    }
  }, 10000);

  if (order === undefined) return <Spinner />;
  if (order === null)
    return <Empty icon={<IconAlert size={28} />} title="Order not found" />;

  async function setStatus(status) {
    if (status === order.status || saving) return;
    setSaving(true);
    try {
      await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status } });
      setOrder({ ...order, status });
      toast(`Order #${order.number} → ${status}`, 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="admin-head">
        <Link to="/admin/orders" className="btn-icon" aria-label="Back to orders">
          <IconReceipt size={18} />
        </Link>
        <div className="flex-1">
          <h1>Order #{order.number}</h1>
          <div className="text-muted text-sm">{fmtDateLong(order.createdAt)}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="card">
        <div className="flex" style={{ fontWeight: 650, marginBottom: 8 }}>
          <IconUser size={18} /> Customer
        </div>
        <div className="kv">
          <span className="k">Name</span>
          <span className="v">{order.customerName}</span>
        </div>
        <div className="kv">
          <span className="k">Phone</span>
          <span className="v">{order.customerPhone || '—'}</span>
        </div>
        <div className="kv">
          <span className="k">Email</span>
          <span className="v">{order.customerEmail}</span>
        </div>
      </div>

      <div className="card mt-12">
        <div className="flex" style={{ fontWeight: 650, marginBottom: 8 }}>
          <IconReceipt size={18} /> Items
        </div>
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
        <div className="summary-row total" style={{ borderTop: 'none' }}>
          <span>Total</span>
          <span>{fmtPrice(order.totalCents)}</span>
        </div>
        {order.note && (
          <p className="text-sm text-muted mt-8" style={{ background: 'var(--bg-soft)', borderRadius: 10, padding: '10px 12px' }}>
            📝 {order.note}
          </p>
        )}
      </div>

      <div className="card mt-12">
        <div style={{ fontWeight: 650, marginBottom: 10 }}>Update status</div>
        <div className="status-picker">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`status-btn ${s === order.status ? `active-${s}` : ''}`}
              onClick={() => setStatus(s)}
              disabled={saving}
            >
              {s}
            </button>
          ))}
        </div>
        {order.status === 'pending' && (
          <p className="text-faint text-sm mt-8">Tip: set to “preparing” once the kitchen starts.</p>
        )}
      </div>
    </>
  );
}
