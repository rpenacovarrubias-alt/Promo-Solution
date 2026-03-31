/**
 * Proxy a la API pública de Express.
 * Ruta: POST /api/quotes → POST /api/public/quotes
 *
 * La PUBLIC_API_KEY nunca llega al cliente — se inyecta aquí en el servidor.
 */
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_API = process.env.ADMIN_API_URL ?? process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:4000'
const API_KEY   = process.env.PUBLIC_API_KEY ?? ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const upstream = await fetch(`${ADMIN_API}/api/public/quotes`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key':    API_KEY,
      },
      body: JSON.stringify(body),
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error('[/api/quotes proxy]', err)
    return NextResponse.json({ error: 'Error al enviar cotización' }, { status: 502 })
  }
}
