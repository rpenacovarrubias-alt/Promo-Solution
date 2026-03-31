import { Router } from 'express'
import prisma from './_db.js'

const router = Router()

const DEFAULTS = {
  ivaPercent: '16',
  defaultMarkup: '30',
  companyName: 'Promo Solution',
  logoUrl: '',
}

router.get('/', async (req, res) => {
  try {
    const rows = await prisma.config.findMany()
    const config = { ...DEFAULTS }
    for (const row of rows) config[row.key] = row.value
    return res.json(config)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  const { ivaPercent, defaultMarkup, companyName, logoUrl } = req.body
  const entries = { ivaPercent, defaultMarkup, companyName, logoUrl }
  try {
    await Promise.all(
      Object.entries(entries).map(([key, value]) =>
        value !== undefined
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
