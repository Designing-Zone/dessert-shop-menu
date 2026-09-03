import React, { useState } from 'react';
import { api, fmtPrice, fmtDate } from '../api.js';
import { Spinner, Empty } from '../components.jsx';
import { IconUsers } from '../icons.jsx';

export default function Customers() {
  const [customers, setCustomers] = useState(undefined);

  if (customers === undefined) {
    api('/admin/customers')
      .then((d) => setCustomers(d.customers))
      .catch(() => setCustomers([]));
  }

  if (customers === undefined) return <Spinner />;
  if (customers.length === 0)
    return <Empty icon={<IconUsers size={28} />} title="No customers yet" sub="Registered customers will appear here." />;

  return (
    <>
      <div className="admin-head">
        <div className="flex-1">
          <h1>Customers</h1>
          <div className="text-muted text-sm">{customers.length} registered</div>
        </div>
      </div>

      <div className="row-list">
        {customers.map((u) => (
          <div key={u.id} className="row-item">
            <div
              className="logo small"
              style={{ width: 40, height: 40, fontSize: 15, fontWeight: 800, borderRadius: 13 }}
            >
              {u.name.trim().charAt(0).toUpperCase()}
            </div>
            <div className="ri-body">
              <div className="ri-title">{u.name}</div>
              <div className="ri-sub">
                {u.email}{u.phone ? ` · ${u.phone}` : ''}
              </div>
            </div>
            <div className="ri-end" style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800 }}>{fmtPrice(u.totalSpentCents)}</div>
              <div className="ri-sub">
                {u.orderCount} order{u.orderCount === 1 ? '' : 's'}
                {u.lastOrderAt ? ` · last ${fmtDate(u.lastOrderAt)}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
