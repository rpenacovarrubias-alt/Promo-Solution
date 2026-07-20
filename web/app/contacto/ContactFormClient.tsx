'use client'

import { useState } from 'react'

interface FormState {
  nombre:   string
  empresa:  string
  email:    string
  telefono: string
  mensaje:  string
}

const INITIAL: FormState = {
  nombre:   '',
  empresa:  '',
  email:    '',
  telefono: '',
  mensaje:  '',
}

export function ContactFormClient() {
  const [form,    setForm]    = useState<FormState>(INITIAL)
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)

    try {
      // Enviamos el mensaje como una cotización de tipo contacto
      const res = await fetch('/api/quotes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name:    form.nombre,
            phone:   form.telefono || `contacto_web_${Date.now()}`,
            email:   form.email    || undefined,
            company: form.empresa  || undefined,
          },
          channel: 'CHAT',
          notes:   `[CONTACTO WEB] ${form.mensaje}`,
          items:   [],
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Error al enviar el mensaje')
      }

      setSent(true)
      setForm(INITIAL)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error. Inténtalo de nuevo.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">¡Mensaje enviado!</p>
          <p className="text-gray-500 text-sm mt-1 max-w-xs">
            Nos pondremos en contacto contigo a la brevedad. También puedes escribirnos por WhatsApp para una respuesta más rápida.
          </p>
        </div>
        <button
          onClick={() => setSent(false)}
          className="text-sm text-navy-700 underline hover:no-underline"
        >
          Enviar otro mensaje
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nombre <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.nombre}
            onChange={set('nombre')}
            placeholder="Juan García"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
          <input
            type="text"
            value={form.empresa}
            onChange={set('empresa')}
            placeholder="Mi Empresa S.A."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Correo electrónico <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            placeholder="correo@ejemplo.com"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono / WhatsApp</label>
          <input
            type="tel"
            value={form.telefono}
            onChange={set('telefono')}
            placeholder="+52 442 123 4567"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Mensaje <span className="text-red-400">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={form.mensaje}
          onChange={set('mensaje')}
          placeholder="Describe tu proyecto, los productos que necesitas, cantidades aproximadas o cualquier duda..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-50
                   text-white font-semibold py-3 rounded-lg text-sm transition-colors"
      >
        {sending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Enviando...
          </span>
        ) : (
          'Enviar mensaje'
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        También puedes escribirnos directamente por{' '}
        <a href="https://wa.me/524421314203" target="_blank" rel="noopener noreferrer"
          className="text-green-600 hover:underline">
          WhatsApp
        </a>{' '}
        para una respuesta inmediata.
      </p>
    </form>
  )
}
