import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SECRET_FILE = path.join(__dirname, '..', 'data', '.jwt_secret');

let secret;
if (process.env.JWT_SECRET) {
  secret = process.env.JWT_SECRET;
} else {
  try {
    secret = fs.readFileSync(SECRET_FILE, 'utf8').trim();
  } catch {
    secret = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
  }
}

export default secret;
