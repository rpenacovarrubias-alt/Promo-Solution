import { getProducts, getCategories } from '@/lib/api'
import { ProductoCard } from '@/components/product/ProductoCard'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props {
  searchParams: {
    q?:        string
    categoryId?: string
    featured?: string
    page?:     string
  }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, categoryId } = searchParams
  const title = categoryId ? `Categoría — Catálogo` : q ? `"${q}" — Búsqueda` : 'Catálogo completo'
  return { title }
}

export default async function CatalogoPage({ searchParams }: Props) {
  const PER_PAGE = 24
  const page     = Math.max(1, parseInt(searchParams.page ?? '1'))

  const [productsRes, categories] = await Promise.all([
    getProducts({
      search:     searchParams.q,
      categoryId: searchParams.categoryId,
      featured:   searchParams.featured === 'true',
      page,
      limit:      PER_PAGE,
    }),
    getCategories(),
  ])

  const { data: productos, pagination } = productsRes
  const { total, totalPages }           = pagination
  const hasFilters = !!(searchParams.q || searchParams.categoryId || searchParams.featured)

  const buildUrl = (p: number) => {
    const s = new URLSearchParams({ ...searchParams, page: String(p) } as Record<string, string>)
    return `/catalogo?${s}`
  }

  // Nombre de la categoría activa
  const activeCategory = categories.find(c => c.id === searchParams.categoryId)

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
                    !searchParams.categoryId
                      ? 'bg-navy-700 text-white font-medium'
                      : 'text-gray-700 hover:bg-navy-50 hover:text-navy-700'
                  }`}>
                  Todos ({total.toLocaleString()})
                </Link>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link
                    href={`/catalogo?categoryId=${cat.id}` + (searchParams.q ? `&q=${searchParams.q}` : '')}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      searchParams.categoryId === cat.id
                        ? 'bg-navy-700 text-white font-medium'
                        : 'text-gray-700 hover:bg-navy-50 hover:text-navy-700'
                    }`}>
                    {cat.name}
                    <span className="ml-1 text-xs opacity-60">({cat.productCount})</span>
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
                {activeCategory?.name
                  ?? (searchParams.q ? `"${searchParams.q}"` : 'Catálogo completo')}
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
