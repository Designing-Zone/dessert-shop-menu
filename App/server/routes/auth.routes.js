import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, publicUser, authRequired } from '../auth.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || String(name).trim().length < 2)
    return res.status(400).json({ error: 'Please enter your full name.' });
  if (!EMAIL_RE.test(String(email || '')))
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!password || String(password).length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (exists) return res.status(409).json({ error: 'An account with this email already exists.' });

  const r = db
    .prepare('INSERT INTO users (name, email, phone, password_hash, role) VALUES (?,?,?,?,?)')
    .run(
      String(name).trim(),
      String(email).toLowerCase().trim(),
      String(phone || '').trim(),
      bcrypt.hashSync(String(password), 10),
      'customer'
    );
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(r.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(String(email || '').toLowerCase().trim());
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash))
    return res.status(401).json({ error: 'Incorrect email or password.' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.post('/password', authRequired, (req, res) => {
  const { current, next } = req.body || {};
  if (!bcrypt.compareSync(String(current || ''), req.user.password_hash))
    return res.status(400).json({ error: 'Current password is incorrect.' });
  if (!next || String(next).length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(String(next), 10),
    req.user.id
  );
  res.json({ ok: true });
});

export default router;
