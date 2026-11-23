'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthContext'
import { formatPrecio } from '@/lib/api'

// Chat web de Julio — el mismo agente que Telegram/Meta, vía /api/chat (proxy de Next).
// Sin sesión no hay precios (misma regla que PriceGate); con sesión Julio conoce al cliente.

interface ChatProduct {
  productId: string
  codigo:    string | null
  nombre:    string
  precio:    number | null
  imagenUrl: string | null
}
interface ChatQuote { folio: string; total: number }
interface Msg {
  id:        string
  role:      'user' | 'assistant'
  text:      string
  products?: ChatProduct[]
  quote?:    ChatQuote | null
  isError?:  boolean
}

const STORAGE_KEY = 'ps_julio_chat_v1'
const MAX_STORED  = 40
const MAX_CHARS   = 1000
const STARTERS    = ['Quiero cotizar mandiles', 'Busco gorras personalizadas', '¿Cómo se paga?']

const newId = () => Math.random().toString(36).slice(2, 10)
function newSessionId() {
  // 32 hex (cumple /^[A-Za-z0-9_-]{16,64}$/ del backend); randomUUID no existe en http inseguro.
  const c = typeof crypto !== 'undefined' ? crypto : undefined
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, '')
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

export function JulioChat() {
  const { client } = useAuth()
  const [open, setOpen]         = useState(false)
  const [sessionId, setSession] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)

  const listRef     = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const wasOpen     = useRef(false)

  // Restaura la conversación (Julio también la recuerda del lado servidor).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (saved?.sessionId) {
        setSession(saved.sessionId)
        setMessages(Array.isArray(saved.messages) ? saved.messages : [])
        return
      }
    } catch { /* sin storage: se vuelve a empezar */ }
    setSession(newSessionId())
  }, [])

  useEffect(() => {
    if (!sessionId) return
    try {
      const keep = messages.filter(m => !m.isError).slice(-MAX_STORED)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, messages: keep }))
    } catch { /* ignorar */ }
  }, [sessionId, messages])

  // Foco: al abrir va al campo; al cerrar regresa al botón.
  useEffect(() => {
    if (open) inputRef.current?.focus()
    else if (wasOpen.current) launcherRef.current?.focus()
    wasOpen.current = open
  }, [open])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending, open])

  const send = useCallback(async (raw: string) => {
    const text = raw.trim().slice(0, MAX_CHARS)
    if (!text || sending || !sessionId) return

    setMessages(prev => [...prev, { id: newId(), role: 'user', text }])
    setInput('')
    setSending(true)

    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId, message: text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? 'No pude responder ahora. Intenta de nuevo.')
      setMessages(prev => [...prev, {
        id: newId(), role: 'assistant', text: data.reply ?? '',
        products: data.products ?? [], quote: data.quote ?? null,
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        id: newId(), role: 'assistant', isError: true,
        text: e instanceof Error ? e.message : 'No pude responder ahora. Intenta de nuevo.',
      }])
    } finally {
      setSending(false)
    }
  }, [sending, sessionId])

  const reset = () => {
    setMessages([])
    setSession(newSessionId())
    inputRef.current?.focus()
  }

  const saludo = client
    ? `Hola ${client.name.split(' ')[0]}, soy Julio, asesor de Promo Solution. Cuéntame qué productos buscas y te armo tu cotización.`
    : 'Hola, soy Julio, asesor de Promo Solution. Cuéntame qué productos buscas y te armo tu cotización.'

  return (
    <>
      {/* Botón flotante — encima del de WhatsApp */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Chatear con Julio, asesor de ventas"
        aria-expanded={open}
        className={`fixed bottom-24 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full
                    bg-navy-700 text-white shadow-lg hover:bg-navy-800 active:scale-[0.97]
                    transition-[transform,opacity,visibility,background-color] duration-150 ease-out
                    ${open ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'}`}
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.3A8 8 0 1121 12z" />
          <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth={2.4} />
        </svg>
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-gold-500 border-2 border-white" aria-hidden="true" />
      </button>

      {/* Panel — sale desde el botón (origin-bottom-right); cierra más rápido de lo que abre */}
      <section
        role="dialog"
        aria-label="Chat con Julio"
        aria-hidden={!open}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
        className={`fixed z-50 bottom-24 left-3 right-3 sm:left-auto sm:right-5 sm:w-[380px]
                    h-[min(560px,calc(100dvh-8.5rem))] flex flex-col overflow-hidden origin-bottom-right
                    rounded-2xl bg-white border border-gray-100 shadow-2xl
                    transition-[opacity,transform,visibility] ease-[cubic-bezier(0.23,1,0.32,1)]
                    motion-reduce:scale-100 motion-reduce:transition-opacity
                    ${open ? 'opacity-100 scale-100 visible duration-200' : 'opacity-0 scale-95 invisible pointer-events-none duration-150'}`}
      >
        <header className="flex items-center gap-3 px-4 py-3 bg-navy-700 text-white">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gold-500 text-navy-900 font-bold text-base" aria-hidden="true">J</div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold leading-tight">Julio</p>
            <p className="text-xs text-navy-200 leading-tight">Asesor de ventas con IA · Promo Solution</p>
          </div>
          <button type="button" onClick={reset} aria-label="Nueva conversación" title="Nueva conversación"
                  className="flex items-center justify-center w-11 h-11 -my-2 rounded-lg text-navy-100 hover:bg-navy-600 active:scale-[0.97] transition-[transform,background-color] duration-150">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 4v6h6M20 20v-6h-6" /><path d="M20 10a8 8 0 00-14-3L4 10M4 14a8 8 0 0014 3l2-3" />
            </svg>
          </button>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar chat"
                  className="flex items-center justify-center w-11 h-11 -my-2 -mr-2 rounded-lg text-navy-100 hover:bg-navy-600 active:scale-[0.97] transition-[transform,background-color] duration-150">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div ref={listRef} role="log" aria-live="polite" aria-relevant="additions"
             className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white">
          <Bubble role="assistant" text={saludo} />

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {STARTERS.map(s => (
                <button key={s} type="button" onClick={() => send(s)} disabled={sending}
                        className="min-h-[44px] px-3.5 rounded-full border border-navy-200 text-sm text-navy-700
                                   hover:bg-navy-50 active:scale-[0.97] transition-[transform,background-color] duration-150">
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className="space-y-2">
              <Bubble role={m.role} text={m.text} isError={m.isError} />
              {m.products?.map(p => <ProductRow key={p.productId} p={p} />)}
              {m.quote && (
                <div className="rounded-xl border border-gold-500 bg-gold-50 px-3.5 py-3">
                  <p className="text-xs font-medium text-gold-800">Cotización generada</p>
                  <p className="text-sm text-navy-900">Folio <span className="font-semibold">{m.quote.folio}</span></p>
                  <p className="text-sm text-navy-900">Total <span className="font-semibold">{formatPrecio(m.quote.total)}</span> (IVA incluido)</p>
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-1.5 px-3.5 py-3 w-fit rounded-2xl rounded-bl-md bg-gray-50 border border-gray-100" aria-label="Julio está escribiendo">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-2 h-2 rounded-full bg-navy-300 animate-pulse motion-reduce:animate-none" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          )}
        </div>

        <form onSubmit={e => { e.preventDefault(); send(input) }}
              className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white">
          <label htmlFor="julio-chat-input" className="sr-only">Escribe tu mensaje</label>
          <input
            id="julio-chat-input" ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            maxLength={MAX_CHARS} autoComplete="off" enterKeyHint="send" placeholder="Escribe tu mensaje"
            className="flex-1 min-w-0 h-11 px-3.5 rounded-xl border border-gray-200 text-base text-gray-800
                       placeholder:text-gray-400 focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100"
          />
          <button type="submit" disabled={sending || !input.trim()} aria-label="Enviar mensaje"
                  className="flex items-center justify-center w-11 h-11 rounded-xl bg-navy-700 text-white
                             hover:bg-navy-800 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100
                             transition-[transform,opacity,background-color] duration-150">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l14-7-5 14-2.5-5.5L5 12z" />
            </svg>
          </button>
        </form>
      </section>
    </>
  )
}

function Bubble({ role, text, isError }: { role: 'user' | 'assistant'; text: string; isError?: boolean }) {
  const mine = role === 'user'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <p className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words rounded-2xl ${
        mine
          ? 'bg-navy-700 text-white rounded-br-md'
          : isError
            ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-md'
            : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-md'
      }`}>
        {text}
      </p>
    </div>
  )
}

function ProductRow({ p }: { p: ChatProduct }) {
  return (
    <a href={`/producto/${p.productId}`} target="_blank" rel="noopener noreferrer"
       className="flex gap-3 p-2 rounded-xl border border-gray-100 bg-white hover:border-navy-200 transition-colors duration-150">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.imagenUrl ?? '/placeholder-product.png'} alt="" width={64} height={64} loading="lazy"
           onError={e => { e.currentTarget.src = '/placeholder-product.png' }}
           className="w-16 h-16 shrink-0 rounded-lg bg-gray-50 object-contain" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{p.nombre}</p>
        {p.codigo && <p className="text-xs text-gray-400 mt-0.5">Cód. {p.codigo}</p>}
        <p className="text-sm mt-1">
          {p.precio != null
            ? <span className="font-semibold text-navy-700">{formatPrecio(p.precio)}</span>
            : <span className="text-xs text-gray-500">Inicia sesión para ver precio</span>}
        </p>
      </div>
    </a>
  )
}
