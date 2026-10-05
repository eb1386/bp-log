import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS users (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    name_key   text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
await sql`
  CREATE TABLE IF NOT EXISTS readings (
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id         text NOT NULL,
    t          bigint NOT NULL,
    sys        smallint NOT NULL,
    dia        smallint NOT NULL,
    pulse      smallint,
    note       text NOT NULL DEFAULT '',
    updated_at bigint NOT NULL,
    deleted    boolean NOT NULL DEFAULT false,
    PRIMARY KEY (user_id, id)
  )`;
console.log('schema ready');
