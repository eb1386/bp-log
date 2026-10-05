import { sql, UUID, body, send } from './_lib.js';

const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);

// Takes the phone's unsent changes, keeps whichever edit is newest per reading,
// and returns the full current list.
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  const { user, changes = [] } = body(req);
  if (!UUID.test(String(user))) return send(res, 400, { error: 'Bad user' });
  if (!Array.isArray(changes) || changes.length > 5000) return send(res, 400, { error: 'Bad changes' });

  const [u] = await sql`SELECT id FROM users WHERE id = ${user}`;
  if (!u) return send(res, 404, { error: 'Unknown user' });

  const rows = [];
  for (const c of changes) {
    const row = {
      id: typeof c.id === 'string' && c.id.length <= 40 ? c.id : null,
      t: int(c.t, 1, 9e15),
      sys: int(c.sys, 50, 300),
      dia: int(c.dia, 25, 200),
      pulse: c.pulse == null ? null : int(c.pulse, 20, 260),
      note: typeof c.note === 'string' ? c.note.slice(0, 140) : '',
      updated_at: int(c.u, 1, 9e15),
      deleted: c.deleted === true,
    };
    if (row.id && row.t && row.sys && row.dia && row.updated_at) rows.push(row);
  }

  if (rows.length) {
    await sql`
      INSERT INTO readings (user_id, id, t, sys, dia, pulse, note, updated_at, deleted)
      SELECT ${user}::uuid, x.id, x.t, x.sys, x.dia, x.pulse, x.note, x.updated_at, x.deleted
      FROM json_to_recordset(${JSON.stringify(rows)}::json)
        AS x(id text, t bigint, sys smallint, dia smallint, pulse smallint, note text, updated_at bigint, deleted boolean)
      ON CONFLICT (user_id, id) DO UPDATE SET
        t = EXCLUDED.t, sys = EXCLUDED.sys, dia = EXCLUDED.dia, pulse = EXCLUDED.pulse,
        note = EXCLUDED.note, updated_at = EXCLUDED.updated_at, deleted = EXCLUDED.deleted
      WHERE readings.updated_at < EXCLUDED.updated_at`;
  }

  const readings = await sql`
    SELECT id, t::float8 AS t, sys, dia, pulse, note, updated_at::float8 AS u
    FROM readings WHERE user_id = ${user} AND NOT deleted ORDER BY t DESC`;
  send(res, 200, { readings });
}
