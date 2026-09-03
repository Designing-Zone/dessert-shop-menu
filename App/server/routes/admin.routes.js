import { Router } from 'express';
import { db } from '../db.js';
import { authRequired, adminRequired } from '../auth.js';
import { upload, removeImageFile } from '../upload.js';

const router = Router();
router.use(authRequired, adminRequired);

/* --------------------------------- stats --------------------------------- */

router.get('/stats', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC day)
  const count = (sql, ...args) => db.prepare(sql).get(...args).n;

  const todayOrders = count(
    `SELECT COUNT(*) n FROM orders WHERE substr(created_at,1,10) = ?`, today
  );
  const pendingOrders = count(
    `SELECT COUNT(*) n FROM orders WHERE status IN ('pending','preparing')`
  );
  const completedOrders = count(
    `SELECT COUNT(*) n FROM orders WHERE status = 'delivered'`
  );
  const todaySales = db
    .prepare(
      `SELECT COALESCE(SUM(total_cents),0) s FROM orders
       WHERE substr(created_at,1,10) = ? AND status != 'cancelled'`
    )
    .get(today).s;
  const productCount = count(`SELECT COUNT(*) n FROM products`);
  const customerCount = count(`SELECT COUNT(*) n FROM users WHERE role = 'customer'`);

  const latestOrders = db
    .prepare(
      `SELECT o.id, o.status, o.total_cents AS totalCents, o.created_at AS createdAt,
              u.name AS customerName
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC LIMIT 6`
    )
    .all()
    .map((o) => ({ ...o, number: 1000 + o.id }));

  res.json({
    todayOrders,
    pendingOrders,
    completedOrders,
    todaySales,
    productCount,
    customerCount,
    latestOrders,
  });
});

/* --------------------------------- orders -------------------------------- */

const ORDER_SELECT = `
  SELECT o.id, o.status, o.note, o.total_cents AS totalCents,
         o.created_at AS createdAt, o.updated_at AS updatedAt,
         u.id AS userId, u.name AS customerName, u.phone AS customerPhone, u.email AS customerEmail
  FROM orders o JOIN users u ON u.id = o.user_id`;

const shape = (o) => ({ ...o, number: 1000 + o.id });

router.get('/orders', (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare(`${ORDER_SELECT} WHERE o.status = ? ORDER BY o.id DESC LIMIT 100`).all(String(status))
    : db.prepare(`${ORDER_SELECT} ORDER BY o.id DESC LIMIT 100`).all();
  const items = db
    .prepare(
      `SELECT id, order_id AS orderId, product_id AS productId, name, price_cents AS priceCents, qty
       FROM order_items WHERE order_id IN (SELECT id FROM orders ORDER BY id DESC LIMIT 100)`
    )
    .all();
  res.json({ orders: rows.map((o) => ({ ...shape(o), items: items.filter((i) => i.orderId === o.id) })) });
});

router.get('/orders/:id', (req, res) => {
  const order = db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  order.items = db
    .prepare(
      `SELECT id, product_id AS productId, name, price_cents AS priceCents, qty
       FROM order_items WHERE order_id = ?`
    )
    .all(order.id);
  res.json({ order: shape(order) });
});

const STATUSES = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
router.patch('/orders/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status))
    return res.status(400).json({ error: 'Invalid status.' });
  const r = db
    .prepare(
      `UPDATE orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?`
    )
    .run(status, req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Order not found.' });
  res.json({ ok: true });
});

/* -------------------------------- products ------------------------------- */

router.get('/products', (_req, res) => {
  const products = db
    .prepare(
      `SELECT id, category_id AS categoryId, name, description, price_cents AS priceCents,
              image, available, created_at AS createdAt
       FROM products ORDER BY category_id, id`
    )
    .all();
  res.json({ products });
});

const PRODUCT_FIELDS = ['name', 'description', 'image', 'categoryId', 'priceCents', 'available'];

router.post('/products', (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const price = Math.round(Number(b.priceCents));
  const categoryId = Number(b.categoryId);
  if (name.length < 2) return res.status(400).json({ error: 'Product name is too short.' });
  if (!Number.isInteger(price) || price < 0 || price > 1000000)
    return res.status(400).json({ error: 'Invalid price.' });
  if (!db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId))
    return res.status(400).json({ error: 'Please choose a valid category.' });

  const r = db
    .prepare(
      `INSERT INTO products (category_id, name, description, price_cents, image, available)
       VALUES (?,?,?,?,?,?)`
    )
    .run(
      categoryId,
      name,
      String(b.description || '').slice(0, 1000),
      price,
      String(b.image || ''),
      b.available === false || b.available === 0 ? 0 : 1
    );
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

router.patch('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  const b = req.body || {};
  const sets = [];
  const vals = [];

  if (b.name !== undefined) {
    const name = String(b.name).trim();
    if (name.length < 2) return res.status(400).json({ error: 'Product name is too short.' });
    sets.push('name = ?');
    vals.push(name);
  }
  if (b.description !== undefined) {
    sets.push('description = ?');
    vals.push(String(b.description).slice(0, 1000));
  }
  if (b.priceCents !== undefined) {
    const price = Math.round(Number(b.priceCents));
    if (!Number.isInteger(price) || price < 0 || price > 1000000)
      return res.status(400).json({ error: 'Invalid price.' });
    sets.push('price_cents = ?');
    vals.push(price);
  }
  if (b.categoryId !== undefined) {
    const catId = Number(b.categoryId);
    if (!db.prepare('SELECT id FROM categories WHERE id = ?').get(catId))
      return res.status(400).json({ error: 'Please choose a valid category.' });
    sets.push('category_id = ?');
    vals.push(catId);
  }
  if (b.available !== undefined) {
    sets.push('available = ?');
    vals.push(b.available ? 1 : 0);
  }
  if (b.image !== undefined) {
    if (existing.image && existing.image !== b.image) removeImageFile(existing.image);
    sets.push('image = ?');
    vals.push(String(b.image || ''));
  }

  if (sets.length === 0) return res.json({ ok: true });
  db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).run(...vals, existing.id);
  res.json({ ok: true });
});

router.delete('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found.' });
  db.prepare('DELETE FROM products WHERE id = ?').run(existing.id);
  removeImageFile(existing.image);
  res.json({ ok: true });
});

/* ------------------------------- categories ------------------------------ */

router.get('/categories', (_req, res) => {
  const categories = db
    .prepare(
      `SELECT c.id, c.name, c.emoji, c.sort_order AS sortOrder,
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS productCount
       FROM categories c ORDER BY c.sort_order, c.id`
    )
    .all();
  res.json({ categories });
});

router.post('/categories', (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (name.length < 2) return res.status(400).json({ error: 'Category name is too short.' });
  const emoji = String(req.body?.emoji || '').slice(0, 4);
  const max = db.prepare('SELECT COALESCE(MAX(sort_order),-1) m FROM categories').get().m;
  const r = db
    .prepare('INSERT INTO categories (name, emoji, sort_order) VALUES (?,?,?)')
    .run(name, emoji, max + 1);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

router.patch('/categories/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Category not found.' });
  const name = req.body?.name !== undefined ? String(req.body.name).trim() : existing.name;
  if (name.length < 2) return res.status(400).json({ error: 'Category name is too short.' });
  const emoji = req.body?.emoji !== undefined ? String(req.body.emoji).slice(0, 4) : existing.emoji;
  const sortOrder =
    req.body?.sortOrder !== undefined ? Math.round(Number(req.body.sortOrder) || 0) : existing.sort_order;
  db.prepare('UPDATE categories SET name = ?, emoji = ?, sort_order = ? WHERE id = ?').run(
    name,
    emoji,
    sortOrder,
    existing.id
  );
  res.json({ ok: true });
});

router.delete('/categories/:id', (req, res) => {
  const n = db
    .prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ?')
    .get(req.params.id).n;
  if (n > 0)
    return res
      .status(400)
      .json({ error: `This category has ${n} product(s). Move or delete them first.` });
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* -------------------------------- customers ------------------------------ */

router.get('/customers', (_req, res) => {
  const customers = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at AS createdAt,
              COUNT(o.id) AS orderCount,
              COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_cents ELSE 0 END),0) AS totalSpentCents,
              MAX(o.created_at) AS lastOrderAt
       FROM users u LEFT JOIN orders o ON o.user_id = u.id
       WHERE u.role = 'customer'
       GROUP BY u.id ORDER BY u.id DESC`
    )
    .all();
  res.json({ customers });
});

/* -------------------------------- settings ------------------------------- */

const SETTING_KEYS = ['restaurant_name', 'restaurant_phone', 'restaurant_address'];

router.get('/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  res.json({ settings: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
});

router.put('/settings', (req, res) => {
  const b = req.body || {};
  const upd = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?,?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  for (const key of SETTING_KEYS) {
    if (b[key] !== undefined) upd.run(key, String(b[key]).slice(0, 200));
  }
  res.json({ ok: true });
});

/* --------------------------------- upload -------------------------------- */

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image received.' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

export default router;
