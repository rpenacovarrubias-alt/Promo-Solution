'use client'

import { useState } from 'react'
import { useCarrito } from '@/components/quote/CarritoContext'
import { getProductImageUrl, getMinQty } from '@/lib/api'
import type { ApiProduct } from '@/lib/api'

interface Props { producto: ApiProduct }

export function AddToCartButton({ producto }: Props) {
  const { add, items } = useCarrito()
  const minQty         = getMinQty(producto)
  const [cantidad, setCantidad] = useState(minQty)
  const [added, setAdded]       = useState(false)
  const inCart = items.some(i => i.producto_id === producto.id)

  const handleAdd = () => {
    add({
      producto_id: producto.id,
      nombre:      producto.name,
      finalPrice:  producto.finalPrice,
      imageUrl:    getProductImageUrl(producto),
      cantidad,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 w-20">Cantidad</label>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setCantidad(c => Math.max(minQty, c - 1))}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 text-lg leading-none">
            −
          </button>
          <input
            type="number"
            value={cantidad}
            min={minQty}
            onChange={e => setCantidad(Math.max(minQty, parseInt(e.target.value) || 1))}
            className="w-16 text-center text-sm py-2 border-x border-gray-200 focus:outline-none"
          />
          <button
            onClick={() => setCantidad(c => c + 1)}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 text-lg leading-none">
            +
          </button>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={!producto.isActive}
        className={`w-full py-3 rounded-xl font-semibold transition-all duration-150 ${
          added
            ? 'bg-green-600 text-white'
            : inCart
            ? 'bg-navy-50 text-navy-700 border border-navy-200 hover:bg-navy-100'
            : 'btn-primary text-base'
        } disabled:opacity-50 disabled:cursor-not-allowed`}>
        {added ? '✓ Agregado a tu cotización' : inCart ? 'Agregar más' : 'Agregar a cotización'}
      </button>

      {inCart && !added && (
        <a href="/cotizar" className="block text-center text-sm text-navy-700 hover:underline">
          Ver mi cotización →
        </a>
      )}
    </div>
  )
}
