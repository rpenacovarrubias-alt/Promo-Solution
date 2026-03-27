import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const DEFAULTS = {
  ivaPercent: '16',
  defaultMarkup: '30',
  companyName: 'Promo Solution',
  logoUrl: '',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const rows = await prisma.config.findMany()
      const config = { ...DEFAULTS }
      for (const row of rows) {
        config[row.key] = row.value
      }
      return res.status(200).json(config)
    }

    if (req.method === 'POST') {
      const { ivaPercent, defaultMarkup, companyName, logoUrl } = req.body
      const entries = { ivaPercent, defaultMarkup, companyName, logoUrl }

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

      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/config]', error)
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
