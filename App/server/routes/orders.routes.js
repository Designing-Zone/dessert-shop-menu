import { Router } from 'express';
import { db } from '../db.js';
import { authRequired } from '../auth.js';

const router = Router();

const ORDER_SELECT = `
  SELECT o.id, o.status, o.note, o.total_cents AS totalCents,
         o.created_at AS createdAt, o.updated_at AS updatedAt,
         u.id AS userId, u.name AS customerName, u.phone AS customerPhone, u.email AS customerEmail
  FROM orders o JOIN users u ON u.id = o.user_id`;

function loadOrder(id) {
  const order = db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(id);
  if (!order) return null;
  order.number = 1000 + order.id;
  order.items = db
    .prepare(
      `SELECT id, product_id AS productId, name, price_cents AS priceCents, qty
       FROM order_items WHERE order_id = ?`
    )
    .all(id);
  return order;
}

/* ------------------------------- customer ------------------------------- */

router.get('/orders', authRequired, (req, res) => {
  const orders = db
    .prepare(`${ORDER_SELECT} WHERE o.user_id = ? ORDER BY o.id DESC LIMIT 50`)
    .all(req.user.id);
  const items = db
    .prepare(
      `SELECT id, order_id AS orderId, product_id AS productId, name, price_cents AS priceCents, qty
       FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)`
    )
    .all(req.user.id);
  for (const o of orders) {
    o.number = 1000 + o.id;
    o.items = items.filter((i) => i.orderId === o.id);
  }
  res.json({ orders });
});

router.get('/orders/:id', authRequired, (req, res) => {
  const order = loadOrder(req.params.id);
  if (!order || order.userId !== req.user.id)
    return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
});

router.post('/orders', authRequired, (req, res) => {
  const { items, note } = req.body || {};
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Your cart is empty.' });

  const clean = [];
  for (const it of items) {
    const qty = Math.floor(Number(it?.qty));
    if (!Number.isInteger(qty) || qty < 1 || qty > 99)
      return res.status(400).json({ error: 'Invalid quantity.' });
    clean.push({ productId: Number(it.productId), qty });
  }

  let created;
  try {
    db.exec('BEGIN');
    const insOrder = db.prepare(
      `INSERT INTO orders (user_id, note, total_cents) VALUES (?,?,0)`
    );
    const insItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, name, price_cents, qty) VALUES (?,?,?,?,?)`
    );
    const updTotal = db.prepare(`UPDATE orders SET total_cents = ? WHERE id = ?`);

    const order = insOrder.run(req.user.id, String(note || '').slice(0, 300));
    const orderId = Number(order.lastInsertRowid);
    let total = 0;
    for (const it of clean) {
      const p = db
        .prepare('SELECT id, name, price_cents, available FROM products WHERE id = ?')
        .get(it.productId);
      if (!p) throw new Error('A product in your cart no longer exists.');
      if (!p.available) throw new Error(`"${p.name}" is currently unavailable.`);
      insItem.run(orderId, p.id, p.name, p.price_cents, it.qty);
      total += p.price_cents * it.qty;
    }
    if (total <= 0) throw new Error('Order total must be greater than zero.');
    updTotal.run(total, orderId);
    db.exec('COMMIT');
    created = loadOrder(orderId);
  } catch (e) {
    db.exec('ROLLBACK');
    return res.status(400).json({ error: e.message || 'Could not place the order.' });
  }

  res.status(201).json({ order: created });
});

export default router;
