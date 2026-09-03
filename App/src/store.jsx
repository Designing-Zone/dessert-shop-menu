import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, setToken } from './api';

const AuthCtx = createContext(null);
const CatalogCtx = createContext(null);
const CartCtx = createContext(null);

/* ------------------------------- auth ------------------------------- */

function readStored(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

/* ------------------------------ provider ----------------------------- */

export function AppProvider({ children }) {
  /* -------- auth -------- */
  const [auth, setAuth] = useState(() => readStored('bh_auth'));
  const [authReady, setAuthReady] = useState(false);

  const saveAuth = useCallback((a) => {
    setAuth(a);
    if (a) localStorage.setItem('bh_auth', JSON.stringify(a));
    else localStorage.removeItem('bh_auth');
  }, []);

  // keep the api client's token in sync
  useEffect(() => {
    setToken(auth?.token || null);
  }, [auth]);

  // validate the stored session once on startup
  useEffect(() => {
    if (!auth?.token) {
      setAuthReady(true);
      return;
    }
    api('/auth/me')
      .then((d) => saveAuth({ ...auth, user: d.user }))
      .catch((e) => {
        if (e.status === 401) saveAuth(null);
      })
      .finally(() => setAuthReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email, password) => {
      const d = await api('/auth/login', { method: 'POST', body: { email, password } });
      saveAuth(d);
      return d.user;
    },
    [saveAuth]
  );

  const register = useCallback(
    async (payload) => {
      const d = await api('/auth/register', { method: 'POST', body: payload });
      saveAuth(d);
      return d.user;
    },
    [saveAuth]
  );

  const logout = useCallback(() => saveAuth(null), [saveAuth]);

  /* -------- catalog (menu) — loaded once, cached, refreshed silently -------- */
  const cached = readStored('bh_catalog');
  const [categories, setCategories] = useState(cached?.categories || []);
  const [products, setProducts] = useState(cached?.products || []);
  const [catalogLoading, setCatalogLoading] = useState(!cached);
  const [catalogError, setCatalogError] = useState(null);

  const refreshCatalog = useCallback(async (silent = true) => {
    if (!silent) setCatalogLoading(true);
    try {
      const d = await api('/catalog');
      setCategories(d.categories);
      setProducts(d.products);
      setCatalogError(null);
      localStorage.setItem('bh_catalog', JSON.stringify(d));
    } catch (e) {
      setCatalogError(e.message);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products]
  );

  /* ------------------------------- cart ------------------------------- */
  const [cart, setCart] = useState(() => readStored('bh_cart') || []);

  useEffect(() => {
    localStorage.setItem('bh_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((productId, qty = 1) => {
    setCart((cur) => {
      const existing = cur.find((i) => i.productId === productId);
      if (existing)
        return cur.map((i) =>
          i.productId === productId ? { ...i, qty: Math.min(99, i.qty + qty) } : i
        );
      return [...cur, { productId, qty }];
    });
  }, []);

  const setCartQty = useCallback((productId, qty) => {
    setCart((cur) =>
      qty <= 0
        ? cur.filter((i) => i.productId !== productId)
        : cur.map((i) => (i.productId === productId ? { ...i, qty } : i))
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((cur) => cur.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartItems = useMemo(
    () =>
      cart
        .map((i) => ({ ...i, product: productById[i.productId] }))
        .filter((i) => i.product),
    [cart, productById]
  );
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.qty, 0), [cartItems]);
  const cartTotal = useMemo(
    () => cartItems.reduce((s, i) => s + i.product.priceCents * i.qty, 0),
    [cartItems]
  );

  const authValue = useMemo(
    () => ({
      user: auth?.user || null,
      authReady,
      login,
      register,
      logout,
      setUser: (u) => auth && saveAuth({ ...auth, user: u }),
    }),
    [auth, authReady, login, register, logout, saveAuth]
  );

  const catalogValue = useMemo(
    () => ({ categories, products, productById, loading: catalogLoading, error: catalogError, refreshCatalog }),
    [categories, products, productById, catalogLoading, catalogError, refreshCatalog]
  );

  const cartValue = useMemo(
    () => ({ items: cartItems, count: cartCount, total: cartTotal, addToCart, setCartQty, removeFromCart, clearCart }),
    [cartItems, cartCount, cartTotal, addToCart, setCartQty, removeFromCart, clearCart]
  );

  return (
    <AuthCtx.Provider value={authValue}>
      <CatalogCtx.Provider value={catalogValue}>
        <CartCtx.Provider value={cartValue}>{children}</CartCtx.Provider>
      </CatalogCtx.Provider>
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export const useCatalog = () => useContext(CatalogCtx);
export const useCart = () => useContext(CartCtx);
