/**
 * Proxy al chat de Julio.
 * Ruta: POST /api/chat → POST /api/public/chat
 *
 * La PUBLIC_API_KEY nunca llega al navegador, y el token de sesión se lee de la
 * cookie httpOnly (si hay sesión, Julio conoce al cliente y usa su % de utilidad).
 */
import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

const ADMIN_API = process.env.ADMIN_API_URL ?? process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:4000'
const API_KEY   = process.env.PUBLIC_API_KEY ?? ''

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message } = await req.json()
    const token = req.cookies.get(SESSION_COOKIE)?.value

    const upstream = await fetch(`${ADMIN_API}/api/public/chat`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key':    API_KEY,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body:  JSON.stringify({ sessionId, message }),
      cache: 'no-store',
    })

    const data = await upstream.json().catch(() => ({ error: 'Respuesta inválida' }))
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error('[/api/chat proxy]', err)
    return NextResponse.json({ error: 'No pude responder ahora. Intenta de nuevo.' }, { status: 502 })
  }
}
