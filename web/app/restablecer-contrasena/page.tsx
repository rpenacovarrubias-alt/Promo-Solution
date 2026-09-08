'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-navy-700/30 focus:border-navy-700'

function ResetPasswordForm() {
  const token = useSearchParams().get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [done, setDone]         = useState(false)
  const [busy, setBusy]         = useState(false)

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        Este enlace no es válido. Solicita uno nuevo desde{' '}
        <Link href="/" className="text-navy-700 font-medium hover:underline">
          Inicia Sesión → Olvidé mi contraseña
        </Link>.
      </p>
    )
  }

  if (done) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-green-700">Contraseña actualizada. Ya puedes iniciar sesión.</p>
        <Link href="/" className="text-navy-700 font-medium text-sm hover:underline">
          ← Volver al inicio
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    if (password !== confirm) return setError('Las contraseñas no coinciden')

    setBusy(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data?.error ?? 'Ocurrió un error, intenta de nuevo')
      setDone(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="new-password" className="block text-sm text-gray-700 mb-1.5">Nueva contraseña:</label>
        <input id="new-password" type="password" required minLength={8} autoComplete="new-password"
          value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm text-gray-700 mb-1.5">Confirmar contraseña:</label>
        <input id="confirm-password" type="password" required minLength={8} autoComplete="new-password"
          value={confirm} onChange={e => setConfirm(e.target.value)} className={inputClass} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="bg-navy-700 hover:bg-navy-800 active:scale-[0.97] disabled:opacity-60
                   text-white text-sm font-semibold tracking-wide px-6 py-2.5 rounded-lg
                   transition-[transform,background-color] duration-150"
      >
        {busy ? 'Un momento…' : 'Guardar nueva contraseña'}
      </button>
    </form>
  )
}

export default function RestablecerContrasenaPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-lg font-bold text-navy-700 tracking-wide mb-5">RESTABLECER CONTRASEÑA</h1>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
