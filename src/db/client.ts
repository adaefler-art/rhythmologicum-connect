import { Pool, PoolConfig, QueryConfig, QueryResult } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const DEFAULT_MAX = parseInt(process.env.PG_MAX_CLIENTS || '10', 10);
const DEFAULT_IDLE = parseInt(process.env.PG_IDLE_TIMEOUT || '30000', 10); // ms
const DEFAULT_CONN_TIMEOUT = parseInt(process.env.PG_CONN_TIMEOUT || '5000', 10); // ms

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: DEFAULT_MAX,
  idleTimeoutMillis: DEFAULT_IDLE,
  connectionTimeoutMillis: DEFAULT_CONN_TIMEOUT,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected idle client error', err);
});

export async function query<T = unknown>(text: string | QueryConfig, params?: unknown[]): Promise<QueryResult<T>> {
  return pool.query(text, params);
}

export async function getClient() {
  return pool.connect();
}

export async function end() {
  return pool.end();
}
