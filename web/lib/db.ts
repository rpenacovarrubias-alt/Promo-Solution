import { Pool } from 'pg'

declare global {
  var _pgPool: Pool | undefined
}

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
}

// Singleton para desarrollo (evita múltiples pools en hot-reload)
export const db: Pool =
  process.env.NODE_ENV === 'production'
    ? createPool()
    : (globalThis._pgPool ?? (globalThis._pgPool = createPool()))

export type DbRow = Record<string, unknown>

export async function query<T = DbRow>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await db.query(sql, params)
  return result.rows as T[]
}

export async function queryOne<T = DbRow>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}
