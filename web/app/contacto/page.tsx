'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FormData {
  name:    string
  email:   string
  phone:   string
  message: string
}

export default function ContactoPage() {
  const [form, setForm]       = useState<FormData>({ name: '', email: '', phone: '', message: '' })
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true); setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar el mensaje')
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contáctanos</h1>
        <p className="text-gray-500">
          ¿Tienes dudas o necesitas algo especial? Escríbenos y te respondemos a la brevedad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 card p-6 space-y-4">
          {success ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Mensaje enviado!</h2>
              <p className="text-gray-500 text-sm">Gracias por escribirnos, te contactaremos pronto.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input
                  type="text" required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mensaje *</label>
                <textarea
                  rows={5} required
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none
                             focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button type="submit" disabled={sending}
                className="btn-gold w-full py-3 text-base disabled:opacity-50">
                {sending ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </>
          )}
        </form>

        {/* Info de contacto */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Otras formas de contactarnos</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-navy-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <a href="mailto:ventas@promosolution.com.mx" className="text-gray-700 hover:text-navy-700">
                  ventas@promosolution.com.mx
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-navy-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <span className="text-gray-700">WhatsApp / Telegram: Julio</span>
              </li>
            </ul>
          </div>

          <div className="card p-6 bg-navy-700 text-white">
            <p className="text-sm text-navy-100 mb-3">
              ¿Ya sabes qué productos necesitas?
            </p>
            <Link href="/catalogo" className="btn-gold w-full justify-center inline-flex py-2.5 text-sm">
              Explorar catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
