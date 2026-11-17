import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const buildPoolConfig = (env = process.env) => {
  const connectionString = env.DATABASE_URL;
  const max = Number(env.DB_POOL_MAX) || 20;
  const idleTimeoutMillis = Number(env.DB_IDLE_TIMEOUT_MS) || 30_000;
  const connectionTimeoutMillis = Number(env.DB_CONNECTION_TIMEOUT_MS) || 10_000;
  const query_timeout = Number(env.DB_QUERY_TIMEOUT_MS) || 30_000;

  if (connectionString) {
    return {
      connectionString,
      ssl: connectionString.includes('neon') ? { rejectUnauthorized: false } : false,
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
      query_timeout,
    };
  }

  return {
    host: env.DB_HOST || 'localhost',
    port: parseInt(env.DB_PORT || '5432', 10),
    user: env.DB_USER || 'postgres',
    password: env.DB_PASSWORD || 'postgres',
    database: env.DB_NAME || 'timesheet',
    max,
    idleTimeoutMillis,
    connectionTimeoutMillis,
    query_timeout,
  };
};

export const resolveDbHostLabel = (env = process.env) => {
  const connectionString = env.DATABASE_URL;
  if (connectionString) {
    const match = connectionString.match(/@([^/:]+)/);
    return match ? match[1] : 'DATABASE_URL (parsed)';
  }
  return env.DB_HOST || 'localhost';
};

export const withPoolClient = async (targetPool, fn) => {
  const client = await targetPool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
};

export const pool = new pg.Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool] Unexpected idle client error:', err.message);
});
