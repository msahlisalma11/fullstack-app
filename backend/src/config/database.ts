// src/config/database.ts
import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

let pool: Pool;

const config = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'greenbite_tn',
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: 'greenbite_backend',
};

/**
 * Initialize database connection pool
 */
export async function initializeDatabase(): Promise<void> {
  try {
    pool = new Pool(config);

    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info('Database connection successful:', result.rows[0]);
    client.release();
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get database pool instance
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

/**
 * Execute a query
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  try {
    const result = await pool.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    };
  } catch (error) {
    logger.error('Database query error:', { text, error });
    throw error;
  }
}

/**
 * Execute a transaction
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
    logger.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

export default { initializeDatabase, getPool, query, transaction, closeDatabase, healthCheck };
