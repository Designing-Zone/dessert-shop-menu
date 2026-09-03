import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'burger.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  available INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','preparing','ready','delivered','cancelled')),
  note TEXT NOT NULL DEFAULT '',
  total_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  qty INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

/* ---------------------------------- seed ---------------------------------- */

function seed() {
  const hasUsers = db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0;
  if (hasUsers) return;

  const hash = (p) => bcrypt.hashSync(p, 10);
  db.prepare(
    `INSERT INTO users (name, email, phone, password_hash, role) VALUES (?,?,?,?,?)`
  ).run('Restaurant Admin', 'admin@burger.app', '555-0100', hash('admin123'), 'admin');
  db.prepare(
    `INSERT INTO users (name, email, phone, password_hash, role) VALUES (?,?,?,?,?)`
  ).run('Alex Demo', 'customer@demo.app', '555-0123', hash('customer123'), 'customer');

  const cats = [
    ['Burgers', '🍔'],
    ['Chicken', '🍗'],
    ['Meals', '🥡'],
    ['Fries', '🍟'],
    ['Drinks', '🥤'],
    ['Sauces', '🥫'],
    ['Offers', '⭐'],
  ];
  const catId = {};
  cats.forEach(([name, emoji], i) => {
    const r = db
      .prepare('INSERT INTO categories (name, emoji, sort_order) VALUES (?,?,?)')
      .run(name, emoji, i);
    catId[name] = Number(r.lastInsertRowid);
  });

  const P = (cat, name, desc, price, img, available = 1) =>
    db
      .prepare(
        'INSERT INTO products (category_id, name, description, price_cents, image, available) VALUES (?,?,?,?,?,?)'
      )
      .run(catId[cat], name, desc, price, `/uploads/${img}`, available);

  P('Burgers', 'Classic Burger', 'Juicy flame-grilled beef patty, melted cheddar, fresh lettuce, tomato and house sauce in a toasted brioche bun.', 599, 'classic-burger.svg');
  P('Burgers', 'Cheese Lover Burger', 'Double cheddar, creamy cheese sauce and crunchy pickles on a juicy beef patty. For serious cheese fans.', 699, 'cheese-burger.svg');
  P('Burgers', 'Double Smash Burger', 'Two seared smash patties, caramelized onions, smoky sauce and melted American cheese. Our best seller.', 899, 'double-smash.svg');
  P('Chicken', 'Crispy Chicken Burger', 'Buttermilk-marinated chicken thigh, fried golden and crunchy, with mayo, lettuce and soft potato bun.', 649, 'chicken-burger.svg');
  P('Chicken', 'Hot Wings (6 pcs)', 'Six crispy wings tossed in our signature hot sauce, served with a cool ranch dip.', 549, 'hot-wings.svg');
  P('Meals', 'Smash Combo Meal', 'Double smash burger with golden fries and any regular drink. The full experience, one price.', 1099, 'smash-combo.svg');
  P('Meals', 'Family Feast Box', '4 classic burgers, 2 large fries and 4 drinks. Made to share — or not.', 2499, 'family-feast.svg');
  P('Fries', 'Golden Fries', 'Crispy golden fries with a light sea-salt finish. Always fresh, never soggy.', 299, 'fries.svg');
  P('Fries', 'Loaded Cheese Fries', 'Golden fries smothered in warm cheese sauce, crispy bacon bits and chives.', 449, 'loaded-fries.svg');
  P('Drinks', 'Coca-Cola (330ml)', 'Ice-cold classic Coca-Cola straight from the fridge.', 150, 'cola.svg');
  P('Drinks', 'Fresh Lemonade', 'Freshly squeezed lemons, a hint of mint, served over ice.', 250, 'lemonade.svg');
  P('Sauces', 'Garlic Sauce', 'Our creamy house-made garlic sauce. Goes with everything.', 75, 'garlic-sauce.svg');
  P('Sauces', 'BBQ Dip', 'Smoky, sweet and a little tangy. Classic BBQ in every dip.', 75, 'bbq-dip.svg');
  P('Offers', 'Burger Duo Deal', 'Any 2 classic burgers + 2 regular drinks. Bring a friend, save $3.', 999, 'duo-deal.svg');
  P('Offers', 'Wing Night Bucket', '12 hot wings + 2 dips of your choice. Perfect for movie night.', 1299, 'wing-bucket.svg');

  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('restaurant_name','Burger House'), ('restaurant_phone','+1 555 010 0100'), ('restaurant_address','12 Grill Street, Downtown')`
  ).run();

  console.log('[db] seeded initial data');
}

seed();

export default db;
