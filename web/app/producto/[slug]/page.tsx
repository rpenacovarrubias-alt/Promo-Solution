import { queryOne, query } from '@/lib/db'
import { getImageUrl, formatPrecio } from '@/lib/productos'
import { ProductoCard } from '@/components/product/ProductoCard'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { ProductoDetalle, Producto } from '@/lib/productos'
import type { Metadata } from 'next'

interface Props { params: { slug: string } }

async function getProducto(slug: string): Promise<ProductoDetalle | null> {
  const isNum = /^\d+$/.test(slug)
  return queryOne<ProductoDetalle>(`
    SELECT p.*, pr.nombre AS proveedor_nombre, pr.codigo AS proveedor_codigo
    FROM productos p JOIN proveedores pr ON pr.id = p.proveedor_id
    WHERE ${isNum ? 'p.id = $1' : 'p.codigo_proveedor ILIKE $1'} AND p.visible_web = TRUE
  `, [isNum ? parseInt(slug) : slug])
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProducto(params.slug)
  if (!p) return { title: 'Producto no encontrado' }
  return {
    title: p.nombre,
    description: p.descripcion ?? `${p.nombre} — ${p.categoria_nombre}. Precio: ${formatPrecio(p.precio_venta)}`,
  }
}

export default async function ProductoPage({ params }: Props) {
  const producto = await getProducto(params.slug)
  if (!producto) notFound()

  const relacionados = await query<Producto>(`
    SELECT p.id, p.codigo_proveedor, p.codigo_prm, p.nombre, p.descripcion,
           p.categoria_nombre, p.precio_venta, p.moneda, p.colores,
           p.tecnica_impresion, p.medidas, p.cantidad_minima, p.tiempo_entrega,
           p.imagen_principal, p.imagenes, p.disponible, p.stock, p.destacado, p.tags,
           pr.nombre AS proveedor_nombre, pr.codigo AS proveedor_codigo
    FROM productos p JOIN proveedores pr ON pr.id = p.proveedor_id
    WHERE p.categoria_nombre = $1 AND p.id != $2
      AND p.visible_web = TRUE AND p.disponible = TRUE
    ORDER BY p.destacado DESC, RANDOM() LIMIT 4
  `, [producto.categoria_nombre, producto.id])

  const imgUrl = getImageUrl(producto.codigo_proveedor, producto.imagen_principal)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <a href="/" className="hover:text-navy-700">Inicio</a>
        <span>/</span>
        <a href="/catalogo" className="hover:text-navy-700">Catálogo</a>
        {producto.categoria_nombre && (
          <>
            <span>/</span>
            <a href={`/catalogo?categoria=${encodeURIComponent(producto.categoria_nombre)}`}
              className="hover:text-navy-700">{producto.categoria_nombre}</a>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600 font-medium">{producto.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">

        {/* Imagen */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <Image
              src={imgUrl}
              alt={producto.nombre}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-8"
              priority
            />
          </div>
          {/* Colores disponibles */}
          {producto.colores && producto.colores.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {producto.colores.map(c => (
                <span key={c} className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-600">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-400 font-mono">{producto.codigo_proveedor}</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{producto.nombre}</h1>
            </div>
            {producto.disponible
              ? <span className="badge-disponible flex-shrink-0">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"/>Disponible
                </span>
              : <span className="badge-agotado flex-shrink-0">Sin stock</span>
            }
          </div>

          {producto.categoria_nombre && (
            <span className="tag mb-4 inline-block">{producto.categoria_nombre}</span>
          )}

          <div className="my-5">
            <p className="text-3xl font-bold text-navy-700">{formatPrecio(producto.precio_venta)}</p>
            {producto.cantidad_minima > 1 && (
              <p className="text-sm text-gray-500 mt-1">Pedido mínimo: {producto.cantidad_minima} piezas</p>
            )}
            {producto.tiempo_entrega && (
              <p className="text-sm text-gray-500">Tiempo de entrega: {producto.tiempo_entrega}</p>
            )}
          </div>

          {producto.descripcion && (
            <p className="text-gray-600 text-sm leading-relaxed mb-5">{producto.descripcion}</p>
          )}

          {/* Ficha técnica */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2.5">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Ficha técnica</h3>
            {[
              { label: 'Código',        value: producto.codigo_proveedor },
              { label: 'Proveedor',     value: producto.proveedor_nombre },
              { label: 'Medidas',       value: producto.medidas },
              { label: 'Peso',          value: producto.peso },
              { label: 'Material',      value: producto.materiales },
              { label: 'Área impresión',value: producto.area_impresion },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex gap-3 text-sm">
                <span className="text-gray-500 w-32 flex-shrink-0">{row.label}</span>
                <span className="text-gray-800 font-medium">{row.value}</span>
              </div>
            ))}

            {producto.tecnica_impresion && producto.tecnica_impresion.length > 0 && (
              <div className="flex gap-3 text-sm">
                <span className="text-gray-500 w-32 flex-shrink-0">Técnicas</span>
                <div className="flex flex-wrap gap-1.5">
                  {producto.tecnica_impresion.map(t => (
                    <span key={t} className="tag text-xs">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <AddToCartButton producto={producto} />

          {producto.ficha_tecnica_url && (
            <a href={producto.ficha_tecnica_url} target="_blank" rel="noopener noreferrer"
              className="btn-outline w-full text-center mt-3 block">
              Descargar ficha técnica (PDF)
            </a>
          )}
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
