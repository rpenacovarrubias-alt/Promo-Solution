'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useCarrito } from '@/components/quote/CarritoContext'
import { useRouter } from 'next/navigation'
import { UserRound, LogOut } from 'lucide-react'
import { LoginModal } from './LoginModal'
import { useAuth } from '@/components/auth/AuthContext'
import { iconFor } from '@/lib/recommendationIcons'
import type { ApiCategory, ApiCollection } from '@/lib/api'

// Panel ancho bajo la cabecera (como Promo Opción). Se abre con hover y con foco de teclado.
const PANEL =
  'absolute inset-x-0 top-full z-50 invisible opacity-0 border-b border-gray-100 bg-white shadow-lg ' +
  'transition-opacity duration-150 ease-out motion-reduce:transition-none ' +
  'group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100'
const MENU_BTN =
  'flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-navy-700 rounded-lg hover:bg-navy-50'
const SUMMARY =
  'flex min-h-[44px] cursor-pointer list-none items-center justify-between py-2 text-sm text-gray-700 [&::-webkit-details-marker]:hidden'

const Chevron = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
  </svg>
)

interface HeaderProps {
  categories?:  ApiCategory[]
  collections?: ApiCollection[]
}

export function Header({ categories = [], collections = [] }: HeaderProps) {
  const topCategories = categories.filter(c => !c.parentId && c.productCount > 0)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const { total: totalItems }     = useCarrito()
  const { client, logout }        = useAuth()
  const router                    = useRouter()
  const searchRef                 = useRef<HTMLInputElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      {/* Top bar */}
      <div className="bg-navy-700 text-white text-xs py-1.5 text-center">
        Más de 5,800 productos • Cotizaciones sin compromiso • ventas@promosolution.com.mx
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En celular el buscador baja a su propia fila (order-last + basis-full) para no quedar diminuto */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2 sm:flex-nowrap sm:h-16 sm:py-0">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image src="/logo.png" alt="Promo Solution" width={300} height={90}
              className="h-9 w-auto" priority />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="order-last basis-full sm:order-none sm:basis-0 sm:flex-1 sm:max-w-xl">
            <div className="relative">
              <input
                ref={searchRef}
                type="search"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Buscar productos (termos, playeras, plumas...)"
                className="w-full pl-4 pr-10 py-2 text-base sm:text-sm border border-gray-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-navy-700/30 focus:border-navy-700"
              />
              <button type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <div className="group">
              <button type="button" className={MENU_BTN} aria-haspopup="true">
                Categorías <Chevron />
              </button>
              <div className={PANEL}>
                <ul className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0.5 px-8 py-5">
                  {topCategories.map(cat => (
                    <li key={cat.id}>
                      <Link href={`/catalogo?categoryId=${cat.id}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-navy-50 hover:text-navy-700">
                        {cat.name}
                        <span className="text-xs text-gray-400">{cat.productCount.toLocaleString()}</span>
                      </Link>
                    </li>
                  ))}
                  <li className="col-span-full mt-2 border-t border-gray-100 pt-2">
                    <Link href="/catalogo" className="block rounded-lg px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
                      Ver todo el catálogo →
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {collections.length > 0 && (
              <div className="group">
                <button type="button" className={MENU_BTN} aria-haspopup="true">
                  Recomendaciones <Chevron />
                </button>
                <div className={PANEL}>
                  <ul className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0.5 px-8 py-5">
                    {collections.map(col => {
                      const Icon = iconFor(col.icon)
                      return (
                        <li key={col.id}>
                          <Link href={`/recomendaciones/${col.code.toLowerCase()}`}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-navy-50 hover:text-navy-700">
                            <Icon className="w-5 h-5 shrink-0 text-navy-700" strokeWidth={1.75} aria-hidden="true" />
                            {col.name}
                          </Link>
                        </li>
                      )
                    })}
                    <li className="col-span-full mt-2 border-t border-gray-100 pt-2">
                      <Link href="/recomendaciones" className="block rounded-lg px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
                        Ver todas las recomendaciones →
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <Link href="/catalogo"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-navy-700 rounded-lg hover:bg-navy-50">
              Catálogo
            </Link>
            <Link href="/contacto"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-navy-700 rounded-lg hover:bg-navy-50">
              Contacto
            </Link>
          </nav>

          {/* Inicia sesión / cuenta */}
          {client ? (
            <div className="hidden md:flex items-center gap-1">
              <span className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700">
                <UserRound className="w-4 h-4" strokeWidth={1.75} />
                Hola, {client.name.split(' ')[0]}
              </span>
              <button
                onClick={() => logout()}
                aria-label="Cerrar sesión"
                className="p-2 text-gray-400 hover:text-navy-700 rounded-lg hover:bg-navy-50 transition-colors">
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                         text-gray-700 hover:text-navy-700 rounded-lg hover:bg-navy-50 transition-colors">
              <UserRound className="w-4 h-4" strokeWidth={1.75} />
              Inicia Sesión
            </button>
          )}

          {/* Cart */}
          <Link href="/cotizar"
            className="relative ml-auto sm:ml-0 flex items-center gap-2 px-3 py-2 bg-navy-700 hover:bg-navy-800
                       text-white text-sm font-medium rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <span className="hidden sm:inline">Cotizar</span>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gold-500 text-navy-900
                               text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Mobile menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-navy-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          <Link href="/catalogo" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Catálogo</Link>
          <details>
            <summary className={SUMMARY}>Categorías <Chevron /></summary>
            <div className="max-h-64 overflow-y-auto pl-3">
              {topCategories.map(cat => (
                <Link key={cat.id} href={`/catalogo?categoryId=${cat.id}`} onClick={() => setMenuOpen(false)}
                  className="block py-2 text-sm text-gray-500">
                  {cat.name}
                </Link>
              ))}
            </div>
          </details>
          {collections.length > 0 && (
            <details>
              <summary className={SUMMARY}>Recomendaciones <Chevron /></summary>
              <div className="max-h-64 overflow-y-auto pl-3">
                {collections.map(col => (
                  <Link key={col.id} href={`/recomendaciones/${col.code.toLowerCase()}`} onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm text-gray-500">
                    {col.name}
                  </Link>
                ))}
              </div>
            </details>
          )}
          <Link href="/contacto" className="block py-2 text-sm text-gray-700">Contacto</Link>
          {client ? (
            <button
              onClick={() => { setMenuOpen(false); logout() }}
              className="flex items-center gap-1.5 py-2 text-sm text-gray-700">
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
              Cerrar sesión ({client.name.split(' ')[0]})
            </button>
          ) : (
            <button
              onClick={() => { setMenuOpen(false); setLoginOpen(true) }}
              className="flex items-center gap-1.5 py-2 text-sm text-gray-700">
              <UserRound className="w-4 h-4" strokeWidth={1.75} />
              Inicia Sesión
            </button>
          )}
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  )
}
