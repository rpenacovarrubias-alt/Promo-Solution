import { getProductById, getProducts, formatPrecio, getProductImageUrl, getMinQty } from '@/lib/api'
import { ProductoCard } from '@/components/product/ProductoCard'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductById(params.slug)
  if (!p) return { title: 'Producto no encontrado' }
  return {
    title: p.name,
    description: p.description ?? `${p.name} — ${p.category?.name ?? ''}. Precio: ${formatPrecio(p.finalPrice)}`,
  }
}

export default async function ProductoPage({ params }: Props) {
  const found = await getProductById(params.slug)
  if (!found) notFound()
  const producto = found   // TypeScript sabe que no es null

  // Relacionados de la misma categoría
  const relacionadosRes = await getProducts({
    categoryId: producto.category?.id,
    limit:      5,
  })
  const relacionados = relacionadosRes.data.filter(p => p.id !== producto.id).slice(0, 4)

  const imgUrl = getProductImageUrl(producto)
  const minQty = getMinQty(producto)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2 flex-wrap">
        <a href="/" className="hover:text-navy-700">Inicio</a>
        <span>/</span>
        <a href="/catalogo" className="hover:text-navy-700">Catálogo</a>
        {producto.category && (
          <>
            <span>/</span>
            <a href={`/catalogo?categoryId=${producto.category.id}`}
              className="hover:text-navy-700">{producto.category.name}</a>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600 font-medium">{producto.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">

        {/* Imagen */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <Image
              src={imgUrl}
              alt={producto.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-8"
              priority
            />
          </div>
          {/* Imágenes adicionales */}
          {producto.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {producto.images.map((img, i) => (
                <div key={i} className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                  <Image src={img.url} alt={`${producto.name} ${i + 1}`} fill className="object-contain p-1" />
                </div>
              ))}
            </div>
          )}
          {/* Colores disponibles */}
          {producto.colors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {producto.colors.map(c => (
                <span key={c.name}
                  className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-600 flex items-center gap-1.5">
                  {c.hex && (
                    <span className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: c.hex }} />
                  )}
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              {producto.provider && (
                <p className="text-xs text-gray-400 font-mono">{producto.provider.slug}</p>
              )}
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{producto.name}</h1>
            </div>
            {producto.isActive
              ? <span className="badge-disponible flex-shrink-0">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"/>Disponible
                </span>
              : <span className="badge-agotado flex-shrink-0">Sin stock</span>
            }
          </div>

          {producto.category && (
            <span className="tag mb-4 inline-block">{producto.category.name}</span>
          )}

          <div className="my-5">
            <p className="text-3xl font-bold text-navy-700">{formatPrecio(producto.finalPrice)}</p>
            {minQty > 1 && (
              <p className="text-sm text-gray-500 mt-1">Pedido mínimo: {minQty} piezas</p>
            )}
          </div>

          {producto.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-5">{producto.description}</p>
          )}

          {/* Ficha técnica */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2.5">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Ficha técnica</h3>
            {[
              { label: 'Proveedor', value: producto.provider?.name },
              ...producto.variants.map((v, i) => [
                { label: i === 0 ? 'Talla / Material' : `Variante ${i + 1}`, value: [v.size, v.material].filter(Boolean).join(' — ') || null },
              ]).flat(),
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex gap-3 text-sm">
                <span className="text-gray-500 w-32 flex-shrink-0">{row.label}</span>
                <span className="text-gray-800 font-medium">{row.value}</span>
              </div>
            ))}
          </div>

          <AddToCartButton producto={producto} />
        </div>
      </div>

      {/* Productos relacionados */}
      {relacionados.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-5">También te puede interesar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relacionados.map(p => <ProductoCard key={p.id} producto={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
