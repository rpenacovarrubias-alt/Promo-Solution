'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useCarrito } from '@/components/quote/CarritoContext'
import { useRouter } from 'next/navigation'

const CATEGORIAS_MENU = [
  'Bebidas', 'Tecnología', 'Oficina y Escritorio', 'Textiles', 'Uniformes',
  'Libretas', 'Llaveros', 'Deportes y tiempo libre', 'Ecológicos', 'Ropa',
]

export function Header() {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const { total: totalItems }     = useCarrito()
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
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-navy-700 rounded-lg flex items-center justify-center">
                <span className="text-gold-500 font-bold text-sm">PS</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-navy-700 font-bold text-sm leading-tight">PROMO</div>
                <div className="text-gold-500 font-bold text-sm leading-tight">SOLUTIONS</div>
              </div>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <input
                ref={searchRef}
                type="search"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Buscar productos (termos, playeras, plumas...)"
                className="w-full pl-4 pr-10 py-2 text-sm border border-gray-200 rounded-lg
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
            <div className="relative group">
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium
                                 text-gray-700 hover:text-navy-700 rounded-lg hover:bg-navy-50">
                Categorías
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {/* Dropdown */}
              <div className="absolute top-full left-0 w-56 bg-white border border-gray-100
                              rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100
                              group-hover:visible transition-all duration-150 z-50 py-1">
                {CATEGORIAS_MENU.map(cat => (
                  <Link key={cat}
                    href={`/catalogo?categoria=${encodeURIComponent(cat)}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-navy-50 hover:text-navy-700">
                    {cat}
                  </Link>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <Link href="/catalogo"
                    className="block px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
                    Ver todas las categorías →
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/catalogo"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-navy-700 rounded-lg hover:bg-navy-50">
              Catálogo
            </Link>
            <Link href="/contacto"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-navy-700 rounded-lg hover:bg-navy-50">
              Contacto
            </Link>
          </nav>

          {/* Cart */}
          <Link href="/cotizar"
            className="relative flex items-center gap-2 px-3 py-2 bg-navy-700 hover:bg-navy-800
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
          <Link href="/catalogo" className="block py-2 text-sm text-gray-700">Catálogo</Link>
          {CATEGORIAS_MENU.map(cat => (
            <Link key={cat} href={`/catalogo?categoria=${encodeURIComponent(cat)}`}
              className="block py-2 text-sm text-gray-500 pl-3">
              {cat}
            </Link>
          ))}
          <Link href="/contacto" className="block py-2 text-sm text-gray-700">Contacto</Link>
        </div>
      )}
    </header>
  )
}
