'use client'

import { useState } from 'react'
import { useCarrito } from '@/components/quote/CarritoContext'
import type { ProductoDetalle } from '@/lib/productos'

interface Props { producto: ProductoDetalle }

export function AddToCartButton({ producto }: Props) {
  const { add, items } = useCarrito()
  const [cantidad, setCantidad] = useState(producto.cantidad_minima ?? 1)
  const [added, setAdded]       = useState(false)
  const inCart = items.some(i => i.producto_id === producto.id)

  const handleAdd = () => {
    add({
      producto_id:      producto.id,
      codigo_proveedor: producto.codigo_proveedor,
      nombre:           producto.nombre,
      precio_venta:     producto.precio_venta,
      imagen_principal: producto.imagen_principal,
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
            onClick={() => setCantidad(c => Math.max(producto.cantidad_minima ?? 1, c - 1))}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 text-lg leading-none">
            −
          </button>
          <input
            type="number"
            value={cantidad}
            min={producto.cantidad_minima ?? 1}
            onChange={e => setCantidad(Math.max(producto.cantidad_minima ?? 1, parseInt(e.target.value) || 1))}
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
        disabled={!producto.disponible}
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
