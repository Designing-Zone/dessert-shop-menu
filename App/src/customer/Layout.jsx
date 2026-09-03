import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useCart } from '../store.jsx';
import { IconHome, IconMenu, IconBag, IconReceipt, IconUser } from '../icons.jsx';

const tabs = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/menu', label: 'Menu', icon: IconMenu },
  { to: '/cart', label: 'Cart', icon: IconBag },
  { to: '/orders', label: 'Orders', icon: IconReceipt },
  { to: '/account', label: 'Account', icon: IconUser },
];

export default function CustomerLayout() {
  const { count } = useCart();
  return (
    <div className="shell">
      <Outlet />
      <nav className="bottom-nav">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <t.icon size={22} />
            {t.label}
            {t.to === '/cart' && count > 0 && <span className="nav-cart-dot">{count}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
