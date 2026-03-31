'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCarrito } from '@/components/quote/CarritoContext'
import { formatPrecio, getProductImageUrl, getMinQty } from '@/lib/api'
import type { ApiProduct } from '@/lib/api'

interface Props {
  producto: ApiProduct
}

export function ProductoCard({ producto }: Props) {
  const { add, items }    = useCarrito()
  const [added, setAdded] = useState(false)

  const inCart = items.some(i => i.producto_id === producto.id)
  const imgUrl = getProductImageUrl(producto)
  const minQty = getMinQty(producto)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    add({
      producto_id: producto.id,
      nombre:      producto.name,
      finalPrice:  producto.finalPrice,
      imageUrl:    imgUrl,
      cantidad:    minQty,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Link href={`/producto/${producto.id}`} className="group block">
      <div className="card overflow-hidden h-full flex flex-col">
        {/* Imagen */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={imgUrl}
            alt={producto.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.src = '/placeholder-product.png'
            }}
          />
          {producto.isFeatured && (
            <span className="absolute top-2 left-2 bg-gold-500 text-navy-900
                             text-xs font-bold px-2 py-0.5 rounded-full">
              Destacado
            </span>
          )}
          {!producto.isActive && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="badge-agotado">Sin stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1 gap-2">
          <div>
            {producto.provider && (
              <p className="text-xs text-gray-400 font-mono">{producto.provider.slug}</p>
            )}
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mt-0.5">
              {producto.name}
            </h3>
          </div>

          {producto.category && (
            <span className="tag text-xs self-start">{producto.category.name}</span>
          )}

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
            <div>
              <p className="text-navy-700 font-semibold text-base">
                {formatPrecio(producto.finalPrice)}
              </p>
              {minQty > 1 && (
                <p className="text-xs text-gray-400">Mín. {minQty} pzas</p>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={!producto.isActive}
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
