'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

export interface Client {
  id:        string
  name:      string
  email:     string
  phone:     string | null
  company:   string | null
  createdAt: string
}

interface RegisterInput {
  name:     string
  email:    string
  password: string
  phone?:   string
  company?: string
}

interface AuthContext {
  client:    Client | null
  loading:   boolean
  login:     (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  register:  (input: RegisterInput) => Promise<{ ok: true } | { ok: false; error: string }>
  logout:    () => Promise<void>
}

const Ctx = createContext<AuthContext | null>(null)

async function parseError(res: Response): Promise<string> {
  const data = await res.json().catch(() => null)
  return data?.error ?? 'Ocurrió un error, intenta de nuevo'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient]   = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setClient(data.client))
      .catch(() => setClient(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) return { ok: false as const, error: await parseError(res) }
    const data = await res.json()
    setClient(data.client)
    return { ok: true as const }
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false as const, error: await parseError(res) }
    const data = await res.json()
    setClient(data.client)
    return { ok: true as const }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setClient(null)
  }, [])

  return (
    <Ctx.Provider value={{ client, loading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
