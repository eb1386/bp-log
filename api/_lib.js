import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL);

// "Evan  Smith " and "evan smith" are the same person.
export const nameKey = (s) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}

export function send(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(data);
}
