/**
 * Base URL of the API. Empty = same origin (normal web hosting).
 * The mobile app is built with VITE_API_BASE=http://<server>:3001 so the
 * packaged WebView talks to the restaurant server over the network.
 */
export const API_BASE = import.meta.env.VITE_API_BASE || '';

/** Turns server asset paths (/uploads/…) into absolute URLs. */
export const assetUrl = (p) => (p && p.startsWith('/') ? API_BASE + p : p || '');

let token = null;

export function setToken(t) {
  token = t;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(API_BASE + '/api' + path, {
    method,
    headers,
    body: formData ? formData : body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) throw new ApiError(data?.error || 'Something went wrong.', res.status);
  return data;
}

export const fmtPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function fmtDateLong(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
