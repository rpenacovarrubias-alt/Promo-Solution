/**
 * Proxy a la API pública de Express.
 * Ruta: GET /api/products/:id → GET /api/public/products/:id
 */
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_API = process.env.ADMIN_API_URL ?? process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:4000'
const API_KEY   = process.env.PUBLIC_API_KEY ?? ''

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const upstream = await fetch(`${ADMIN_API}/api/public/products/${params.slug}`, {
      headers: { 'X-API-Key': API_KEY },
      next: { revalidate: 60 },
    })
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error('[/api/products/[slug] proxy]', err)
    return NextResponse.json({ error: 'Error al consultar producto' }, { status: 502 })
  }
}
