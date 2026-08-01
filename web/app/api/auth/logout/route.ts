/**
 * Proxy a la API pública de Express.
 * Ruta: POST /api/auth/logout → POST /api/public/auth/logout
 */
import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

const ADMIN_API = process.env.ADMIN_API_URL ?? process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:4000'
const API_KEY   = process.env.PUBLIC_API_KEY ?? ''

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value

  if (token) {
    await fetch(`${ADMIN_API}/api/public/auth/logout`, {
      method:  'POST',
      headers: { 'X-API-Key': API_KEY, Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
