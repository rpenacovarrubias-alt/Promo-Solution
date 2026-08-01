/**
 * Proxy a la API pública de Express.
 * Ruta: GET /api/auth/me → GET /api/public/auth/me
 * Lee el token de la cookie httpOnly — nunca desde el cliente.
 */
import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

const ADMIN_API = process.env.ADMIN_API_URL ?? process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:4000'
const API_KEY   = process.env.PUBLIC_API_KEY ?? ''

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return NextResponse.json({ client: null }, { status: 200 })

  try {
    const upstream = await fetch(`${ADMIN_API}/api/public/auth/me`, {
      headers: { 'X-API-Key': API_KEY, Authorization: `Bearer ${token}` },
      cache:   'no-store',
    })
    if (!upstream.ok) return NextResponse.json({ client: null }, { status: 200 })

    const data = await upstream.json()
    return NextResponse.json({ client: data.client })
  } catch (err) {
    console.error('[/api/auth/me proxy]', err)
    return NextResponse.json({ client: null }, { status: 200 })
  }
}
