'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

type Mode = 'login' | 'register' | 'forgot'

const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-navy-700/30 focus:border-navy-700'

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { login, register } = useAuth()
  const [mode, setMode]       = useState<Mode>('login')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [info, setInfo]       = useState<string | null>(null)
  const [busy, setBusy]       = useState(false)
  const dialogRef              = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    setMode('login')
    setError(null)
    setInfo(null)
    setPassword('')
  }, [open])

  if (!open) return null

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setInfo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        const result = await login(email, password)
        if (result.ok) onClose()
        else setError(result.error)
      } else if (mode === 'register') {
        const result = await register({ name, email, password, phone: phone || undefined })
        if (result.ok) onClose()
        else setError(result.error)
      } else {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const data = await res.json()
        setInfo(data.message ?? 'Si el correo existe, se enviará un enlace para restablecer la contraseña.')
      }
    } finally {
      setBusy(false)
    }
  }

  const titles: Record<Mode, string> = {
    login: 'INICIAR SESIÓN',
    register: 'CREAR CUENTA',
    forgot: 'RECUPERAR CONTRASEÑA',
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4
                 transition-opacity duration-200"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl
                   animate-[login-modal-in_200ms_cubic-bezier(0.23,1,0.32,1)]"
      >
        <div className="flex items-start justify-between mb-6">
          <Image src="/logo.png" alt="Promo Solution" width={300} height={90} className="h-8 w-auto" />
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-gray-400 hover:text-gray-600 transition-colors -mt-1 -mr-1 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 id="login-modal-title" className="text-lg font-bold text-navy-700 tracking-wide mb-5">
          {titles[mode]}
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-sm text-gray-700 mb-1.5">Nombre:</label>
              <input id="auth-name" type="text" required autoComplete="name"
                value={name} onChange={e => setName(e.target.value)} className={inputClass} />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-sm text-gray-700 mb-1.5">Correo electrónico:</label>
            <input id="auth-email" type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="auth-phone" className="block text-sm text-gray-700 mb-1.5">Teléfono (opcional):</label>
              <input id="auth-phone" type="tel" autoComplete="tel"
                value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <label htmlFor="auth-password" className="block text-sm text-gray-700 mb-1.5">Contraseña:</label>
              <input id="auth-password" type="password" required minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-700">{info}</p>}

          <div className="flex flex-col items-end gap-2 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="bg-navy-700 hover:bg-navy-800 active:scale-[0.97] disabled:opacity-60
                         text-white text-sm font-semibold tracking-wide px-6 py-2.5 rounded-lg
                         transition-[transform,background-color] duration-150"
            >
              {busy ? 'Un momento…' : titles[mode]}
            </button>

            {mode === 'login' && (
              <>
                <p className="text-sm text-gray-600">
                  No tengo cuenta,{' '}
                  <button type="button" onClick={() => switchMode('register')}
                    className="text-navy-700 font-medium hover:underline">crear</button>
                </p>
                <button type="button" onClick={() => switchMode('forgot')}
                  className="text-sm text-gray-500 hover:text-navy-700 hover:underline">
                  Olvidé mi contraseña
                </button>
              </>
            )}

            {mode !== 'login' && (
              <button type="button" onClick={() => switchMode('login')}
                className="text-sm text-gray-500 hover:text-navy-700 hover:underline">
                ← Volver a iniciar sesión
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
