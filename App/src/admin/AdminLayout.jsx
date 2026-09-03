import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store.jsx';
import { Logo, IconGrid, IconReceipt, IconBox, IconTag, IconUsers, IconGear, IconLogout } from '../icons.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: IconGrid, end: true },
  { to: '/admin/orders', label: 'Orders', icon: IconReceipt },
  { to: '/admin/products', label: 'Products', icon: IconBox },
  { to: '/admin/categories', label: 'Categories', icon: IconTag },
  { to: '/admin/customers', label: 'Customers', icon: IconUsers },
  { to: '/admin/settings', label: 'Settings', icon: IconGear },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  function doLogout() {
    logout();
    nav('/admin/login');
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="brand">
          <Logo size={34} /> Burger House
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}>
            <n.icon size={19} />
            {n.label}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className="admin-nav-item" style={{ fontSize: 13 }}>
          <IconUsers size={19} />
          <span className="flex-1" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</span>
        </div>
        <button className="admin-nav-item" onClick={doLogout} style={{ color: 'var(--danger)' }}>
          <IconLogout size={19} /> Log out
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-mobile-head">
          <div className="row">
            <Logo size={32} />
            <span className="brand-name">Burger House</span>
            <button className="btn-icon" style={{ width: 36, height: 36 }} onClick={doLogout} aria-label="Log out">
              <IconLogout size={17} />
            </button>
          </div>
          <nav className="admin-tabs">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <n.icon size={16} />
                {n.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
