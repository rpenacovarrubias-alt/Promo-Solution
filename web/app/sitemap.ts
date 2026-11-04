import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/api'
import { SITE_URL } from '@/lib/site'

// Dinámico a propósito: en el build la API puede no estar alcanzable.
// ponytail: apiFetch ya cachea cada página 60 s; si Google lo pide muy seguido, cachear el resultado completo.
export const dynamic = 'force-dynamic'

const FIJAS = ['', '/catalogo', '/cotizar', '/contacto', '/privacidad']
const LOTE = 10 // páginas de la API en paralelo (la API limita a 100 productos por página)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date()
  const urls: MetadataRoute.Sitemap = FIJAS.map(p => ({ url: `${SITE_URL}${p}`, lastModified: ahora }))

  try {
    const primera = await getProducts({ limit: 100, page: 1 })
    const productos = [...primera.data]
    const total = primera.pagination.totalPages

    for (let desde = 2; desde <= total; desde += LOTE) {
      const paginas = Array.from({ length: Math.min(LOTE, total - desde + 1) }, (_, i) => desde + i)
      const res = await Promise.all(paginas.map(page => getProducts({ limit: 100, page })))
      res.forEach(r => productos.push(...r.data))
    }

    for (const p of productos) urls.push({ url: `${SITE_URL}/producto/${p.id}`, lastModified: ahora })
  } catch {
    // Si la API falla, al menos devolvemos las páginas fijas en vez de un 500.
  }

  return urls
}
