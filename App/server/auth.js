import jwt from 'jsonwebtoken';
import secret from './secret.js';
import { db } from './db.js';

export function signToken(user) {
  return jwt.sign({ uid: user.id, role: user.role }, secret, { expiresIn: '30d' });
}

export function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role };
}

/** Verifies the Bearer token and attaches req.user (fresh from DB). */
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in.' });
  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.uid);
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  req.user = user;
  next();
}

/** Must be used after authRequired. */
export function adminRequired(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access only.' });
  next();
}
