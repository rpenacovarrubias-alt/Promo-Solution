/**
 * Proxy a la API pública de Express.
 * Ruta: /api/services → GET /api/public/services
 *
 * Uso: el cliente Next.js llama /api/services para evitar exponer
 * la PUBLIC_API_KEY en el bundle del navegador.
 */
import { NextResponse } from 'next/server'

const ADMIN_API = process.env.ADMIN_API_URL ?? process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:4000'
const API_KEY   = process.env.PUBLIC_API_KEY ?? ''

export async function GET() {
  try {
    const upstream = await fetch(`${ADMIN_API}/api/public/services`, {
      headers: { 'X-API-Key': API_KEY },
      next: { revalidate: 300 },
    })
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error('[/api/services proxy]', err)
    return NextResponse.json({ error: 'Error al consultar técnicas de impresión' }, { status: 502 })
  }
}
