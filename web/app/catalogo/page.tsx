import { getProducts, getCategories } from '@/lib/api'
import { ProductoCard } from '@/components/product/ProductoCard'
import { Pagination } from '@/components/product/Pagination'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/session'
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

  // Cliente con sesión -> precios calculados con SU % de descuento, no el
  // generico de categoría (ver routes/public/products.js).
  const token = cookies().get(SESSION_COOKIE)?.value

  const [productsRes, categories] = await Promise.all([
    getProducts({
      search:     searchParams.q,
      categoryId: searchParams.categoryId,
      featured:   searchParams.featured === 'true',
      page,
      limit:      PER_PAGE,
    }, token),
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

  // Árbol de 2 niveles: las subcategorías de una principal se despliegan cuando
  // esa rama está activa (la principal o una de sus hijas seleccionada).
  const activeTopId = activeCategory?.parentId ?? activeCategory?.id
  const topCategories = categories.filter(c => !c.parentId && c.productCount > 0)
  const withQuery = (id: string) => `/catalogo?categoryId=${id}` + (searchParams.q ? `&q=${searchParams.q}` : '')
  const linkClass = (active: boolean, extra = '') =>
    `block px-3 py-2.5 rounded-lg text-sm transition-colors ${extra} ${
      active ? 'bg-navy-700 text-white font-medium' : 'text-gray-700 hover:bg-navy-50 hover:text-navy-700'
    }`

  const categoryList = (
    <ul className="space-y-0.5">
      <li>
        <Link href="/catalogo" className={linkClass(!searchParams.categoryId)}>
          Todos ({total.toLocaleString()})
        </Link>
      </li>
      {topCategories.map(cat => (
        <li key={cat.id}>
          <Link href={withQuery(cat.id)} className={linkClass(searchParams.categoryId === cat.id)}>
            {cat.name}
            <span className="ml-1 text-xs opacity-60">({cat.productCount})</span>
          </Link>
          {activeTopId === cat.id && (
            <ul className="mt-0.5 mb-1 ml-3 space-y-0.5 border-l border-gray-200 pl-2">
              {categories.filter(s => s.parentId === cat.id).map(sub => (
                <li key={sub.id}>
                  <Link href={withQuery(sub.id)} className={linkClass(searchParams.categoryId === sub.id, '!py-2')}>
                    {sub.name}
                    <span className="ml-1 text-xs opacity-60">({sub.productCount})</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar filtros: en celular es un desplegable cerrado (los productos quedan arriba);
            en pantallas grandes, la lista fija de siempre */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          <details className="lg:hidden rounded-xl border border-gray-200 bg-white group">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between px-4 py-2.5
                                text-sm font-medium text-gray-800 [&::-webkit-details-marker]:hidden">
              <span>Categorías: <span className="font-normal text-gray-500">{activeCategory?.name ?? 'Todas'}</span></span>
              <svg className="w-4 h-4 text-gray-500 transition-transform duration-150 group-open:rotate-180"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="max-h-72 overflow-y-auto border-t border-gray-100 p-2">{categoryList}</div>
          </details>

          <div className="hidden lg:block sticky top-20">
            <h2 className="font-semibold text-gray-800 mb-3">Categorías</h2>
            {categoryList}
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

          <Pagination page={page} totalPages={totalPages} href={buildUrl} />
        </div>
      </div>
    </div>
  )
}
