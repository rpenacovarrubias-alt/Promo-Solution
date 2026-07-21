/**
 * Promo Solution — Servidor Express (local / Docker)
 * La app en sí (rutas + middleware) vive en app.js, compartida con
 * api/index.js (función serverless única en Vercel).
 *
 * Variables de entorno requeridas:
 *   DATABASE_URL     — postgresql://user:pass@host:5432/db
 *   PUBLIC_API_KEY   — API key para los endpoints /api/public/*
 *   PORT             — puerto del servidor (default: 4000)
 *   NODE_ENV         — 'production' | 'development'
 */

import 'dotenv/config'
import app from './app.js'

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`✅ Promo Solution Admin — puerto ${PORT}`)
  console.log(`   Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
  console.log(`   API pública: /api/public/*  (requiere X-API-Key)`)
})
