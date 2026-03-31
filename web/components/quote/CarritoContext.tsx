'use client'

import { createContext, useContext, useReducer, useCallback } from 'react'

export interface CartItem {
  producto_id: string   // cuid del producto en Prisma
  nombre:      string
  finalPrice:  number   // precio con utilidad ya incluida
  imageUrl:    string | null
  cantidad:    number
  color?:      string
  tecnica?:    string
}

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD';    item: CartItem }
  | { type: 'REMOVE'; producto_id: string }
  | { type: 'UPDATE'; producto_id: string; cantidad: number }
  | { type: 'CLEAR' }

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const exists = state.items.find(i => i.producto_id === action.item.producto_id)
      if (exists) {
        return {
          items: state.items.map(i =>
            i.producto_id === action.item.producto_id
              ? { ...i, cantidad: i.cantidad + action.item.cantidad }
              : i
          ),
        }
      }
      return { items: [...state.items, action.item] }
    }
    case 'REMOVE':
      return { items: state.items.filter(i => i.producto_id !== action.producto_id) }
    case 'UPDATE':
      return {
        items: state.items.map(i =>
          i.producto_id === action.producto_id ? { ...i, cantidad: action.cantidad } : i
        ),
      }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

interface CartContext {
  items:    CartItem[]
  total:    number
  subtotal: number
  add:      (item: CartItem) => void
  remove:   (producto_id: string) => void
  update:   (producto_id: string, cantidad: number) => void
  clear:    () => void
}

const Ctx = createContext<CartContext | null>(null)

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] })

  const add    = useCallback((item: CartItem) => dispatch({ type: 'ADD', item }), [])
  const remove = useCallback((id: string) => dispatch({ type: 'REMOVE', producto_id: id }), [])
  const update = useCallback((id: string, cantidad: number) =>
    dispatch({ type: 'UPDATE', producto_id: id, cantidad }), [])
  const clear  = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  const subtotal = state.items.reduce((s, i) => s + i.finalPrice * i.cantidad, 0)

  return (
    <Ctx.Provider value={{
      items:    state.items,
      total:    state.items.reduce((s, i) => s + i.cantidad, 0),
      subtotal,
      add, remove, update, clear,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCarrito() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCarrito must be used within CarritoProvider')
  return ctx
}
