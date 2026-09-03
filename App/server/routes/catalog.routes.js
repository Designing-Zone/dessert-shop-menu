import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

/**
 * One call powers the whole customer app (home + menu): categories with
 * product counts, plus every product with its availability flag.
 */
router.get('/catalog', (_req, res) => {
  const categories = db
    .prepare(
      `SELECT c.id, c.name, c.emoji,
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
       FROM categories c ORDER BY c.sort_order, c.id`
    )
    .all();
  const products = db
    .prepare(
      `SELECT id, category_id AS categoryId, name, description, price_cents AS priceCents,
              image, available
       FROM products ORDER BY id`
    )
    .all();
  res.json({ categories, products });
});

/** Public restaurant info (name/phone/address) shown on the customer home. */
router.get('/info', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const info = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({ info });
});

export default router;
