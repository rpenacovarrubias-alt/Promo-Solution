import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { getCollection, getCollections, getProducts } from '@/lib/api'
import { iconFor } from '@/lib/recommendationIcons'
import { SESSION_COOKIE } from '@/lib/session'
import { ProductoCard } from '@/components/product/ProductoCard'
import { Pagination } from '@/components/product/Pagination'

interface Props {
  params:       { code: string }
  searchParams: { page?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const col = await getCollection(params.code)
  return col
    ? { title: `${col.name} — Recomendaciones`, description: col.description ?? undefined }
    : { title: 'Recomendación no encontrada' }
}

export default async function RecomendacionPage({ params, searchParams }: Props) {
  const PER_PAGE = 24
  const page     = Math.max(1, parseInt(searchParams.page ?? '1') || 1)
  // Con sesión, los precios se calculan con el % del cliente (igual que /catalogo).
  const token    = cookies().get(SESSION_COOKIE)?.value

  const col = await getCollection(params.code)
  if (!col) notFound()

  const [productsRes, all] = await Promise.all([
    getProducts({ collectionId: col.id, page, limit: PER_PAGE }, token),
    getCollections().catch(() => []),
  ])
  const { data: productos, pagination } = productsRes
  const Icon = iconFor(col.icon)
  const others = all.filter(c => c.id !== col.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav aria-label="Ruta" className="mb-4 text-sm text-gray-500">
        <Link href="/recomendaciones" className="hover:text-navy-700 hover:underline">Recomendaciones</Link>
        <span aria-hidden="true" className="mx-1.5">/</span>
        <span className="text-gray-800">{col.name}</span>
      </nav>

      <header className="mb-6 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
          <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{col.name}</h1>
          <p className="text-sm text-gray-500">
            {pagination.total.toLocaleString()} producto{pagination.total === 1 ? '' : 's'}
          </p>
          {col.description && <p className="mt-1 max-w-2xl text-gray-600">{col.description}</p>}
        </div>
      </header>

      {productos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {productos.map(p => <ProductoCard key={p.id} producto={p} />)}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">Esta recomendación aún no tiene productos</p>
          <Link href="/catalogo" className="btn-primary mt-4 inline-block">Ver el catálogo</Link>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        href={p => `/recomendaciones/${params.code}?page=${p}`}
      />

      {others.length > 0 && (
        <section aria-labelledby="otras" className="mt-14">
          <h2 id="otras" className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Otras recomendaciones
          </h2>
          <ul className="flex flex-wrap gap-2">
            {others.map(o => (
              <li key={o.id}>
                <Link
                  href={`/recomendaciones/${o.code.toLowerCase()}`}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-gray-200 px-4 text-sm text-gray-700
                             transition-colors duration-150 hover:border-navy-700 hover:text-navy-700"
                >
                  {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
