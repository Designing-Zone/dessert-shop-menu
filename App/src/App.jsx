import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './store.jsx';
import { Toaster } from './toast.jsx';
import { Spinner } from './components.jsx';

import CustomerLayout from './customer/Layout.jsx';
import Home from './customer/Home.jsx';
import MenuPage from './customer/MenuPage.jsx';
import Cart from './customer/Cart.jsx';
import Orders from './customer/Orders.jsx';
import OrderDetail from './customer/OrderDetail.jsx';
import Account from './customer/Account.jsx';
import Login from './customer/Login.jsx';
import Register from './customer/Register.jsx';

import AdminLayout from './admin/AdminLayout.jsx';
import AdminLogin from './admin/AdminLogin.jsx';
import Dashboard from './admin/Dashboard.jsx';
import AdminOrders from './admin/AdminOrders.jsx';
import AdminOrderDetail from './admin/AdminOrderDetail.jsx';
import Products from './admin/Products.jsx';
import ProductForm from './admin/ProductForm.jsx';
import Categories from './admin/Categories.jsx';
import Customers from './admin/Customers.jsx';
import Settings from './admin/Settings.jsx';

function RequireAuth({ children }) {
  const { user, authReady } = useAuth();
  const loc = useLocation();
  if (!authReady) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, authReady } = useAuth();
  if (!authReady) return <Spinner />;
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* ------------------------------ customer ------------------------------ */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <RequireAuth>
                <OrderDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* -------------------------------- admin -------------------------------- */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="customers" element={<Customers />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
