/**
 * Proxy a la API pública de Express.
 * Ruta: /api/products → GET /api/public/products
 *
 * Uso: el cliente Next.js llama /api/products para evitar exponer
 * la PUBLIC_API_KEY en el bundle del navegador.
 */
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_API  = process.env.ADMIN_API_URL ?? process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:4000'
const API_KEY    = process.env.PUBLIC_API_KEY ?? ''

export async function GET(req: NextRequest) {
  // Reenviar todos los query params
  const qs = req.nextUrl.searchParams.toString()
  const url = `${ADMIN_API}/api/public/products${qs ? `?${qs}` : ''}`

  try {
    const upstream = await fetch(url, {
      headers: { 'X-API-Key': API_KEY },
      next: { revalidate: 60 },
    })
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error('[/api/products proxy]', err)
    return NextResponse.json({ error: 'Error al consultar productos' }, { status: 502 })
  }
}
