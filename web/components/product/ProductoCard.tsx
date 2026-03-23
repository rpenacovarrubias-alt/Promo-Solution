'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCarrito } from '@/components/quote/CarritoContext'
import { getImageUrl, formatPrecio } from '@/lib/productos'
import type { Producto } from '@/lib/productos'

interface Props {
  producto: Producto
}

export function ProductoCard({ producto }: Props) {
  const { add, items }   = useCarrito()
  const [added, setAdded] = useState(false)

  const inCart = items.some(i => i.producto_id === producto.id)
  const imgUrl = getImageUrl(producto.codigo_proveedor, producto.imagen_principal)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    add({
      producto_id:      producto.id,
      codigo_proveedor: producto.codigo_proveedor,
      nombre:           producto.nombre,
      precio_venta:     producto.precio_venta,
      imagen_principal: producto.imagen_principal,
      cantidad:         1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Link href={`/producto/${producto.codigo_proveedor}`} className="group block">
      <div className="card overflow-hidden h-full flex flex-col">
        {/* Imagen */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={imgUrl}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const t = e.target as HTMLImageElement
              t.src = '/placeholder-product.png'
            }}
          />
          {producto.destacado && (
            <span className="absolute top-2 left-2 bg-gold-500 text-navy-900
                             text-xs font-bold px-2 py-0.5 rounded-full">
              Destacado
            </span>
          )}
          {!producto.disponible && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="badge-agotado">Sin stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1 gap-2">
          <div>
            <p className="text-xs text-gray-400 font-mono">{producto.codigo_proveedor}</p>
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mt-0.5">
              {producto.nombre}
            </h3>
          </div>

          {producto.categoria_nombre && (
            <span className="tag text-xs self-start">{producto.categoria_nombre}</span>
          )}

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
            <div>
              <p className="text-navy-700 font-semibold text-base">
                {formatPrecio(producto.precio_venta)}
              </p>
              {producto.cantidad_minima > 1 && (
                <p className="text-xs text-gray-400">Mín. {producto.cantidad_minima} pzas</p>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={!producto.disponible}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                         transition-all duration-150 ${
                inCart || added
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-navy-700 hover:bg-navy-800 text-white'
              }`}
            >
              {inCart || added ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  Agregado
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 4v16m8-8H4"/>
                  </svg>
                  Cotizar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
