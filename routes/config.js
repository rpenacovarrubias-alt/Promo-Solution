import { Router } from 'express'
import prisma from './_db.js'

const router = Router()

const DEFAULTS = {
  ivaPercent: '16',
  defaultMarkup: '33',
  companyName: 'Promo Solution',
  logoUrl: '',
}

// Claves internas (tokens/credenciales en caché, p. ej. promo_option_token de
// lib/adapters/promoOption.js) — nunca salen por la API ni se pueden pisar
// desde ella. Los adaptadores las leen/escriben directo con prisma.
const SECRET_KEY = /token|secret|password|passwd|api[_-]?key|credential/i

router.get('/', async (req, res) => {
  try {
    const rows = await prisma.config.findMany()
    const config = { ...DEFAULTS }
    for (const row of rows) if (!SECRET_KEY.test(row.key)) config[row.key] = row.value
    return res.json(config)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  try {
    await Promise.all(
      Object.entries(req.body).map(([key, value]) =>
        value !== undefined && !SECRET_KEY.test(key)
          ? prisma.config.upsert({
              where: { key },
              update: { value: String(value) },
              create: { key, value: String(value) },
            })
          : Promise.resolve(),
      ),
    )
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
