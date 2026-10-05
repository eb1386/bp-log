import { sql, nameKey, body, send } from './_lib.js';

// First visit creates the account; typing the same name later finds it again.
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  const name = String(body(req).name || '').normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 40) return send(res, 400, { error: 'Name must be 1-40 characters' });

  const [user] = await sql`
    INSERT INTO users (name, name_key) VALUES (${name}, ${nameKey(name)})
    ON CONFLICT (name_key) DO UPDATE SET name_key = EXCLUDED.name_key
    RETURNING id, name, (xmax = 0) AS created`;
  send(res, 200, user);
}
