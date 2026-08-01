/**
 * Proxy a la API pública de Express.
 * Ruta: POST /api/auth/login → POST /api/public/auth/login
 */
import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session'

const ADMIN_API = process.env.ADMIN_API_URL ?? process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:4000'
const API_KEY   = process.env.PUBLIC_API_KEY ?? ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const upstream = await fetch(`${ADMIN_API}/api/public/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body:    JSON.stringify(body),
    })
    const data = await upstream.json()
    if (!upstream.ok) return NextResponse.json(data, { status: upstream.status })

    const res = NextResponse.json({ client: data.client })
    res.cookies.set(SESSION_COOKIE, data.token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   SESSION_MAX_AGE,
    })
    return res
  } catch (err) {
    console.error('[/api/auth/login proxy]', err)
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 502 })
  }
}
