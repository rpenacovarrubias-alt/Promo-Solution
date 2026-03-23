'use client'

import { useState } from 'react'
import { useCarrito } from '@/components/quote/CarritoContext'
import { getImageUrl, formatPrecio } from '@/lib/productos'
import Image from 'next/image'
import Link from 'next/link'

interface FormData {
  nombre: string; empresa: string; email: string; telefono: string; notas: string
}

export default function CotizarPage() {
  const { items, remove, update, subtotal, clear } = useCarrito()
  const [form, setForm] = useState<FormData>({ nombre:'', empresa:'', email:'', telefono:'', notas:'' })
  const [sending, setSending]   = useState(false)
  const [success, setSuccess]   = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!items.length) return
    setSending(true); setError(null)

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nombre:  form.nombre,
          cliente_email:   form.email || undefined,
          cliente_empresa: form.empresa || undefined,
          canal:           'web',
          notas:           form.notas || undefined,
          items: items.map(i => ({
            producto_id: i.producto_id,
            cantidad:    i.cantidad,
            color:       i.color,
            tecnica:     i.tecnica,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar')
      setSuccess(data.folio)
      clear()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar la cotización')
    } finally {
      setSending(false)
    }
  }

  if (success) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Cotización enviada!</h1>
      <p className="text-gray-500 mb-1">Folio: <strong className="text-navy-700">{success}</strong></p>
      <p className="text-gray-500 mb-8 text-sm">
        Nos pondremos en contacto contigo a la brevedad para confirmar los detalles.
      </p>
      <Link href="/catalogo" className="btn-primary">Seguir explorando</Link>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi cotización</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">Tu cotización está vacía</p>
          <Link href="/catalogo" className="btn-primary">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <div key={item.producto_id} className="card p-4 flex gap-4">
                <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                  <Image
                    src={getImageUrl(item.codigo_proveedor, item.imagen_principal)}
                    alt={item.nombre}
                    fill className="object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-mono">{item.codigo_proveedor}</p>
                  <p className="font-medium text-gray-800 text-sm line-clamp-2">{item.nombre}</p>
                  <p className="text-navy-700 font-semibold text-sm mt-1">{formatPrecio(item.precio_venta)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => remove(item.producto_id)}
                    className="text-gray-300 hover:text-red-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                  <div className="flex items-center border border-gray-200 rounded-lg text-sm overflow-hidden">
                    <button onClick={() => update(item.producto_id, Math.max(1, item.cantidad - 1))}
                      className="px-2 py-1 hover:bg-gray-50">−</button>
                    <span className="px-3 py-1 border-x border-gray-200 text-center min-w-[2.5rem]">
                      {item.cantidad}
                    </span>
                    <button onClick={() => update(item.producto_id, item.cantidad + 1)}
                      className="px-2 py-1 hover:bg-gray-50">+</button>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatPrecio(item.precio_venta * item.cantidad)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Formulario + resumen */}
          <div>
            <div className="card p-5 mb-4">
              <h2 className="font-semibold text-gray-800 mb-4">Resumen</h2>
              <div className="space-y-2 text-sm">
                {items.map(i => (
                  <div key={i.producto_id} className="flex justify-between gap-2">
                    <span className="text-gray-600 truncate">{i.nombre} ×{i.cantidad}</span>
                    <span className="font-medium flex-shrink-0">{formatPrecio(i.precio_venta * i.cantidad)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-semibold text-base">
                  <span>Subtotal</span>
                  <span className="text-navy-700">{formatPrecio(subtotal)}</span>
                </div>
                <p className="text-xs text-gray-400">* Precios no incluyen decorado/impresión</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Tus datos</h2>
              {[
                { name: 'nombre',   label: 'Nombre *',   required: true,  type: 'text' },
                { name: 'empresa',  label: 'Empresa',    required: false, type: 'text' },
                { name: 'email',    label: 'Email',      required: false, type: 'email' },
                { name: 'telefono', label: 'Teléfono',   required: false, type: 'tel' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    value={form[f.name as keyof FormData]}
                    onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                <textarea rows={2} value={form.notas}
                  onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                  placeholder="Colores, técnica de impresión, fecha requerida..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 resize-none"/>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button type="submit" disabled={sending}
                className="btn-gold w-full py-3 text-base disabled:opacity-50">
                {sending ? 'Enviando...' : 'Enviar cotización'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
