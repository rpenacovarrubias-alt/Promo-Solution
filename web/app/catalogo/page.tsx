import { query } from '@/lib/db'
import { ProductoCard } from '@/components/product/ProductoCard'
import Link from 'next/link'
import type { Producto } from '@/lib/productos'
import type { Metadata } from 'next'

interface Props {
  searchParams: { q?: string; categoria?: string; proveedor?: string; page?: string; destacado?: string }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, categoria } = searchParams
  const title = categoria ? `${categoria} — Catálogo` : q ? `"${q}" — Búsqueda` : 'Catálogo completo'
  return { title }
}

async function getProductos(params: Props['searchParams']): Promise<{ productos: Producto[]; total: number }> {
  const PER_PAGE = 24
  const page     = Math.max(1, parseInt(params.page ?? '1'))
  const offset   = (page - 1) * PER_PAGE

  const conds: string[]  = ['p.visible_web = TRUE', 'p.disponible = TRUE']
  const vals:  unknown[] = []

  if (params.q) {
    vals.push(params.q)
    conds.push(`(p.nombre ILIKE '%'||$${vals.length}||'%' OR p.codigo_proveedor ILIKE '%'||$${vals.length}||'%')`)
  }
  if (params.categoria) {
    vals.push(params.categoria)
    conds.push(`p.categoria_nombre ILIKE $${vals.length}`)
  }
  if (params.proveedor) {
    vals.push(params.proveedor)
    conds.push(`pr.codigo = $${vals.length}`)
  }
  if (params.destacado === 'true') conds.push(`p.destacado = TRUE`)

  const where = conds.join(' AND ')
  vals.push(PER_PAGE); vals.push(offset)

  const [productos, counts] = await Promise.all([
    query<Producto>(`
      SELECT p.id, p.codigo_proveedor, p.codigo_prm, p.nombre, p.descripcion,
             p.categoria_nombre, p.precio_venta, p.moneda, p.colores,
             p.tecnica_impresion, p.medidas, p.cantidad_minima, p.tiempo_entrega,
             p.imagen_principal, p.imagenes, p.disponible, p.stock, p.destacado, p.tags,
             pr.nombre AS proveedor_nombre, pr.codigo AS proveedor_codigo
      FROM productos p JOIN proveedores pr ON pr.id = p.proveedor_id
      WHERE ${where}
      ORDER BY p.destacado DESC, p.nombre ASC
      LIMIT $${vals.length - 1} OFFSET $${vals.length}
    `, vals),
    query<{ total: string }>(`
      SELECT COUNT(*) AS total FROM productos p
      JOIN proveedores pr ON pr.id = p.proveedor_id WHERE ${where}
    `, vals.slice(0, -2)),
  ])

  return { productos, total: parseInt(counts[0]?.total ?? '0') }
}

async function getCategorias(): Promise<string[]> {
  const rows = await query<{ nombre: string }>(
    `SELECT DISTINCT categoria_nombre AS nombre FROM productos
     WHERE visible_web = TRUE AND disponible = TRUE AND categoria_nombre IS NOT NULL
     ORDER BY nombre`
  )
  return rows.map(r => r.nombre)
}

export default async function CatalogoPage({ searchParams }: Props) {
  const PER_PAGE = 24
  const page     = Math.max(1, parseInt(searchParams.page ?? '1'))

  const [{ productos, total }, categorias] = await Promise.all([
    getProductos(searchParams),
    getCategorias(),
  ])

  const totalPages = Math.ceil(total / PER_PAGE)
  const hasFilters = !!(searchParams.q || searchParams.categoria || searchParams.proveedor)

  const buildUrl = (p: number) => {
    const s = new URLSearchParams({ ...searchParams, page: String(p) } as Record<string, string>)
    return `/catalogo?${s}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar filtros */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          <div className="sticky top-20">
            <h2 className="font-semibold text-gray-800 mb-3">Categorías</h2>
            <ul className="space-y-0.5">
              <li>
                <Link href="/catalogo"
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    !searchParams.categoria
                      ? 'bg-navy-700 text-white font-medium'
                      : 'text-gray-700 hover:bg-navy-50 hover:text-navy-700'
                  }`}>
                  Todos ({total})
                </Link>
              </li>
              {categorias.map(cat => (
                <li key={cat}>
                  <Link
                    href={`/catalogo?categoria=${encodeURIComponent(cat)}` + (searchParams.q ? `&q=${searchParams.q}` : '')}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      searchParams.categoria === cat
                        ? 'bg-navy-700 text-white font-medium'
                        : 'text-gray-700 hover:bg-navy-50 hover:text-navy-700'
                    }`}>
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header resultados */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {searchParams.categoria ?? (searchParams.q ? `"${searchParams.q}"` : 'Catálogo completo')}
              </h1>
              <p className="text-sm text-gray-500">{total.toLocaleString()} productos</p>
            </div>
            {hasFilters && (
              <Link href="/catalogo" className="text-sm text-navy-700 hover:underline">
                Limpiar filtros
              </Link>
            )}
          </div>

          {/* Grid */}
          {productos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {productos.map(p => <ProductoCard key={p.id} producto={p} />)}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No se encontraron productos</p>
              <Link href="/catalogo" className="btn-primary mt-4 inline-block">Ver todo el catálogo</Link>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {page > 1 && (
                <Link href={buildUrl(page - 1)} className="btn-outline px-3 py-2">← Anterior</Link>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i))
                return (
                  <Link key={p} href={buildUrl(p)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-navy-700 text-white'
                        : 'border border-gray-200 text-gray-700 hover:border-navy-700'
                    }`}>
                    {p}
                  </Link>
                )
              })}
              {page < totalPages && (
                <Link href={buildUrl(page + 1)} className="btn-outline px-3 py-2">Siguiente →</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
