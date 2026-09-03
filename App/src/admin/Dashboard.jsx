import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtPrice, fmtDate } from '../api.js';
import { StatusBadge, Spinner, usePoll } from '../components.jsx';
import { IconReceipt, IconClock, IconCheck, IconBag, IconBox, IconUsers } from '../icons.jsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  usePoll(async () => {
    try {
      setStats(await api('/admin/stats'));
    } catch {
      /* ignore, retried on next poll */
    }
  }, 20000);

  if (!stats) return <Spinner />;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <div className="admin-head">
        <div className="flex-1">
          <h1>Dashboard</h1>
          <div className="text-muted text-sm">{today}</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card accent">
          <div className="s-label"><IconReceipt size={15} /> Today's orders</div>
          <div className="s-value">{stats.todayOrders}</div>
        </div>
        <div className="stat-card">
          <div className="s-label"><IconClock size={15} /> Pending now</div>
          <div className="s-value">{stats.pendingOrders}</div>
        </div>
        <div className="stat-card">
          <div className="s-label"><IconCheck size={15} /> Completed</div>
          <div className="s-value">{stats.completedOrders}</div>
        </div>
        <div className="stat-card accent">
          <div className="s-label"><IconBag size={15} /> Today's sales</div>
          <div className="s-value">{fmtPrice(stats.todaySales)}</div>
        </div>
        <div className="stat-card">
          <div className="s-label"><IconBox size={15} /> Products</div>
          <div className="s-value">{stats.productCount}</div>
        </div>
        <div className="stat-card">
          <div className="s-label"><IconUsers size={15} /> Customers</div>
          <div className="s-value">{stats.customerCount}</div>
        </div>
      </div>

      <div className="section">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 17 }}>Latest orders</h2>
          <Link className="more" style={{ color: 'var(--brand)', fontWeight: 600, fontSize: 13.5 }} to="/admin/orders">
            View all
          </Link>
        </div>
        <div className="row-list">
          {stats.latestOrders.length === 0 && (
            <p className="text-faint text-sm" style={{ padding: '18px 4px' }}>
              No orders yet today.
            </p>
          )}
          {stats.latestOrders.map((o) => (
            <Link key={o.id} to={`/admin/orders/${o.id}`} className="row-item clickable">
              <div className="flex-1">
                <div className="ri-title">#{o.number} · {o.customerName}</div>
                <div className="ri-sub">{fmtDate(o.createdAt)}</div>
              </div>
              <div className="ri-end">
                <span style={{ fontWeight: 800 }}>{fmtPrice(o.totalCents)}</span>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
