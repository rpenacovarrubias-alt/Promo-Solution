import { Router } from 'express'
import prisma from './_db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { clientId, status } = req.query
  try {
    const quotes = await prisma.quote.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(status && { status }),
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(quotes)
  } catch (e) {
    console.error('[quotes GET]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  const { clientId, channels, subtotal, iva, total, notes, status, items } = req.body
  if (!clientId || subtotal === undefined || iva === undefined || total === undefined) {
    return res.status(400).json({ error: 'clientId, subtotal, iva, total are required' })
  }
  try {
    const quote = await prisma.quote.create({
      data: {
        clientId,
        channels: channels ?? [],
        subtotal: parseFloat(subtotal),
        iva: parseFloat(iva),
        total: parseFloat(total),
        notes: notes || null,
        ...(status && { status }),
        items: items ? {
          create: items.map(item => ({
            productId: item.productId || null,
            serviceId: item.serviceId || null,
            quantity: item.quantity ?? 1,
            unitPrice: parseFloat(item.unitPrice),
            markup: parseFloat(item.markup),
            subtotal: parseFloat(item.subtotal),
          })),
        } : undefined,
      },
      include: { client: true, items: true },
    })
    return res.status(201).json(quote)
  } catch (e) {
    console.error('[quotes POST]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: { client: true, items: { include: { product: true, service: true } } },
    })
    if (!quote) return res.status(404).json({ error: 'Quote not found' })
    return res.json(quote)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  const { status, channels, notes, subtotal, iva, total } = req.body
  try {
    const quote = await prisma.quote.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(channels !== undefined && { channels }),
        ...(notes !== undefined && { notes }),
        ...(subtotal !== undefined && { subtotal: parseFloat(subtotal) }),
        ...(iva !== undefined && { iva: parseFloat(iva) }),
        ...(total !== undefined && { total: parseFloat(total) }),
      },
      include: { client: true },
    })
    return res.json(quote)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Quote not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.quote.delete({ where: { id: req.params.id } })
    return res.status(204).end()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Quote not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
