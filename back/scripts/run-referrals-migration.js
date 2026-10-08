import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '../migrations/20251008120000-referrals.sql');

const client = new pg.Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'food',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const sql = readFileSync(sqlPath, 'utf8');

try {
  await client.connect();
  await client.query(sql);
  console.log('Referral migration applied successfully.');
} catch (err) {
  console.error('Referral migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
