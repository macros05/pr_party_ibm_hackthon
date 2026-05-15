import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'demo_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

/**
 * Execute a query with parameters
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function query(sql: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

/**
 * Execute a query and return first row or null
 * @param sql SQL query string
 * @param params Query parameters
 * @returns First row or null
 */
export async function queryOne(sql: string, params: any[] = []) {
  const result = await query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Execute multiple queries in a transaction
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 * @param callback Function that receives a client and performs queries
 * @returns Result from callback
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close all database connections
 * Should be called on application shutdown
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

// Made with Bob
