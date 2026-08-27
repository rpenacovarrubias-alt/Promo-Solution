'use client'

import { useAuth } from '@/components/auth/AuthContext'
import { formatPrecio } from '@/lib/api'

interface Props {
  price: number
  className?: string
}

/** Muestra el precio solo a clientes con sesión iniciada; a visitantes sin
 *  cuenta les pide iniciar sesión en vez del monto. Único lugar donde se
 *  decide esto — ProductoCard y la ficha de producto lo usan igual. */
export function PriceGate({ price, className }: Props) {
  const { client, loading } = useAuth()

  if (loading) return <span className={className}>&nbsp;</span>

  if (!client) {
    return (
      <span className={`text-gray-400 font-normal ${className ?? ''}`}>
        Inicia sesión para ver precio
      </span>
    )
  }

  return <span className={className}>{formatPrecio(price)}</span>
}
