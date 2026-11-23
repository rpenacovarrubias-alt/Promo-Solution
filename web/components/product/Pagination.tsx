import Link from 'next/link'

interface Props {
  page:       number
  totalPages: number
  href:       (page: number) => string
}

/** Paginación con ventana de 5 páginas (la misma del catálogo). */
export function Pagination({ page, totalPages, href }: Props) {
  if (totalPages <= 1) return null
  const windowSize = Math.min(5, totalPages)
  const start = Math.max(1, Math.min(page - 2, totalPages - windowSize + 1))
  const pages = Array.from({ length: windowSize }, (_, i) => start + i)

  return (
    <nav aria-label="Paginación" className="flex justify-center gap-2 mt-10">
      {page > 1 && <Link href={href(page - 1)} className="btn-outline px-3 py-2">← Anterior</Link>}
      {pages.map(p => (
        <Link key={p} href={href(p)} aria-current={p === page ? 'page' : undefined}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            p === page
              ? 'bg-navy-700 text-white'
              : 'border border-gray-200 text-gray-700 hover:border-navy-700'
          }`}>
          {p}
        </Link>
      ))}
      {page < totalPages && <Link href={href(page + 1)} className="btn-outline px-3 py-2">Siguiente →</Link>}
    </nav>
  )
}
