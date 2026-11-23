import { Router } from 'express'
import prisma from '../_db.js'
import { handleTextMessage } from '../../lib/julio/agent.js'
import { getSessionClient } from './_session.js'

// POST /api/public/chat — chat web de Julio. Mismo agente que Telegram/Meta
// (lib/julio/agent.js); aquí solo se valida, se limita y se identifica al cliente.
// El navegador nunca llama directo: pasa por el proxy de Next (web/app/api/chat), que
// agrega X-API-Key y el token de sesión.

const router = Router()

const MAX_CHARS = 1000
const SESSION_ID = /^[A-Za-z0-9_-]{16,64}$/
// Cada mensaje cuesta una llamada a la API de Anthropic, así que el canal abierto al
// público lleva tope. ponytail: conteo contra JulioMessage (sin infraestructura nueva);
// si el tráfico crece, pasar a Redis/Upstash con límite por IP.
const MAX_PER_SESSION_HOUR = 40
const MAX_GLOBAL_HOUR = 400

const CLIENT_SELECT = { id: true, name: true, email: true, phone: true, company: true, markupPercent: true }

router.post('/', async (req, res) => {
  const { sessionId, message } = req.body ?? {}
  const text = typeof message === 'string' ? message.trim() : ''

  if (typeof sessionId !== 'string' || !SESSION_ID.test(sessionId)) return res.status(400).json({ error: 'sessionId inválido' })
  if (!text) return res.status(400).json({ error: 'El mensaje no puede estar vacío' })
  if (text.length > MAX_CHARS) return res.status(400).json({ error: `El mensaje es muy largo (máximo ${MAX_CHARS} caracteres)` })

  const sid = `web:${sessionId}`
  const since = new Date(Date.now() - 60 * 60 * 1000)

  try {
    const [propios, globales] = await Promise.all([
      prisma.julioMessage.count({ where: { sessionId: sid, role: 'USER', createdAt: { gte: since } } }),
      prisma.julioMessage.count({ where: { sessionId: { startsWith: 'web:' }, role: 'USER', createdAt: { gte: since } } }),
    ])
    if (propios >= MAX_PER_SESSION_HOUR || globales >= MAX_GLOBAL_HOUR) {
      return res.status(429).json({ error: 'Hay muchas consultas en este momento. Intenta de nuevo en un rato.' })
    }

    const cliente = await getSessionClient(req, CLIENT_SELECT)
    const { text: reply, products, quote } = await handleTextMessage(sid, 'CHAT', text, cliente)

    return res.json({
      reply,
      products: products.slice(0, 6),
      quote: quote ? { folio: quote.folio, total: quote.total } : null,
    })
  } catch (e) {
    console.error('[public/chat]', e)
    return res.status(500).json({ error: 'No pude responder ahora. Intenta de nuevo.' })
  }
})

export default router
