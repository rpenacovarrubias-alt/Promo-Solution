import { Router } from 'express'
import { createQuote, QuoteValidationError } from '../../lib/quotes.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const result = await createQuote(req.body ?? {})
    return res.status(201).json(result)
  } catch (e) {
    if (e instanceof QuoteValidationError) return res.status(400).json({ error: e.message })
    console.error('[public/quotes POST]', e)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
