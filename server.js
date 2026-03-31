/**
 * Promo Solution — Servidor Express
 * Sirve el admin panel (React/Vite build) + todos los endpoints API.
 *
 * Variables de entorno requeridas:
 *   DATABASE_URL     — postgresql://user:pass@host:5432/db
 *   PUBLIC_API_KEY   — API key para los endpoints /api/public/*
 *   PORT             — puerto del servidor (default: 4000)
 *   NODE_ENV         — 'production' | 'development'
 */

import 'dotenv/config'
import express         from 'express'
import cors            from 'cors'
import path            from 'path'
import { fileURLToPath } from 'url'

// ── Rutas admin ──────────────────────────────────────────────────────────────
import dashboardRouter   from './routes/dashboard.js'
import categoriesRouter  from './routes/categories.js'
import clientsRouter     from './routes/clients.js'
import collectionsRouter from './routes/collections.js'
import configRouter      from './routes/config.js'
import productsRouter    from './routes/products.js'
import providersRouter   from './routes/providers.js'
import quotesRouter      from './routes/quotes.js'
import servicesRouter    from './routes/services.js'
import syncRouter        from './routes/sync.js'
import usersRouter       from './routes/users.js'

// ── Rutas públicas (para n8n / bots) ─────────────────────────────────────────
import { requireApiKey }        from './routes/public/auth.js'
import publicProductsRouter     from './routes/public/products.js'
import publicCategoriesRouter   from './routes/public/categories.js'
import publicProvidersRouter    from './routes/public/providers.js'
import publicQuotesRouter       from './routes/public/quotes.js'

// ────────────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app       = express()
const PORT      = process.env.PORT || 4000
const isProd    = process.env.NODE_ENV === 'production'

// ── Middleware global ────────────────────────────────────────────────────────
app.use(cors({
  origin: isProd ? ['https://promosolution.com.mx', 'https://admin.promosolution.com.mx'] : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false }))

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'promo-solution-admin', timestamp: new Date().toISOString() })
})

// ── Rutas API pública (requieren X-API-Key) ───────────────────────────────────
app.use('/api/public/products',   requireApiKey, publicProductsRouter)
app.use('/api/public/categories', requireApiKey, publicCategoriesRouter)
app.use('/api/public/providers',  requireApiKey, publicProvidersRouter)
app.use('/api/public/quotes',     requireApiKey, publicQuotesRouter)

// ── Rutas API admin ───────────────────────────────────────────────────────────
app.use('/api/dashboard',   dashboardRouter)
app.use('/api/categories',  categoriesRouter)
app.use('/api/clients',     clientsRouter)
app.use('/api/collections', collectionsRouter)
app.use('/api/config',      configRouter)
app.use('/api/products',    productsRouter)
app.use('/api/providers',   providersRouter)
app.use('/api/quotes',      quotesRouter)
app.use('/api/services',    servicesRouter)
app.use('/api/sync',        syncRouter)
app.use('/api/users',       usersRouter)

// ── Servir frontend React (Vite build) ───────────────────────────────────────
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// SPA fallback — todas las rutas no-API devuelven index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// ── Manejo global de errores ─────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[server error]', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Arrancar servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Promo Solution Admin — puerto ${PORT}`)
  console.log(`   Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
  console.log(`   API pública: /api/public/*  (requiere X-API-Key)`)
})
