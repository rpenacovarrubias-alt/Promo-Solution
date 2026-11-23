import Link from 'next/link'
import { getCollections } from '@/lib/api'
import { iconFor } from '@/lib/recommendationIcons'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recomendaciones',
  description: 'Ideas de productos promocionales por temporada y tema: Navidad, fitness, ecológicos y más, de todos nuestros proveedores.',
}

export default async function RecomendacionesPage() {
  const collections = await getCollections().catch(() => [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900">Recomendaciones</h1>
        <p className="mt-1 text-gray-500">
          Ideas por temporada y por tema. Cada recomendación reúne productos de todos nuestros proveedores.
        </p>
      </header>

      {collections.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">Pronto tendremos recomendaciones</p>
          <Link href="/catalogo" className="btn-primary mt-4 inline-block">Ver el catálogo</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {collections.map(col => {
            const Icon = iconFor(col.icon)
            return (
              <li key={col.id}>
                <Link
                  href={`/recomendaciones/${col.code.toLowerCase()}`}
                  className="group flex h-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4
                             transition-[border-color,box-shadow,transform] duration-150 ease-out
                             hover:border-navy-700 hover:shadow-md active:scale-[0.98] motion-reduce:transition-none"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700
                                   transition-colors duration-150 group-hover:bg-navy-700 group-hover:text-white">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-gray-900">{col.name}</span>
                    <span className="block text-sm text-gray-500">
                      {col.productCount.toLocaleString()} producto{col.productCount === 1 ? '' : 's'}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
