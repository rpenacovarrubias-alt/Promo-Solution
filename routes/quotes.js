import { Router } from 'express'
import { renderToStream } from '@react-pdf/renderer'
import * as XLSX from 'xlsx'
import React from 'react'
import prisma from './_db.js'
import { QuotePdfDocument } from '../lib/pdf/quotePdf.js'

const router = Router()

async function loadQuoteFull(id) {
  return prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      seller: { select: { name: true } },
      items: {
        include: {
          product: { include: { images: { orderBy: { isPrimary: 'desc' }, take: 1 } } },
          service: true,
        },
      },
    },
  })
}

function itemName(item) {
  return item.product?.name ?? item.service?.name ?? 'Item'
}

function itemCode(item) {
  return item.product?.externalId ?? ''
}

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
        seller: { select: { id: true, name: true } },
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
  const { clientId, sellerId, channels, subtotal, iva, total, notes, status, items } = req.body
  if (!clientId || subtotal === undefined || iva === undefined || total === undefined) {
    return res.status(400).json({ error: 'clientId, subtotal, iva, total are required' })
  }
  try {
    const quote = await prisma.quote.create({
      data: {
        clientId,
        sellerId: sellerId || null,
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
            printTechnique: item.printTechnique || null,
            printUnitCost: item.printUnitCost ? parseFloat(item.printUnitCost) : 0,
          })),
        } : undefined,
      },
      include: { client: true, seller: { select: { id: true, name: true } }, items: true },
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

router.get('/:id/pdf', async (req, res) => {
  try {
    const quote = await loadQuoteFull(req.params.id)
    if (!quote) return res.status(404).json({ error: 'Quote not found' })

    const configRows = await prisma.config.findMany({
      where: { key: { in: ['logos.principal', 'logos.secundario', 'logos.uso.pdf'] } },
    })
    const cfg = Object.fromEntries(configRows.map((r) => [r.key, r.value]))
    const logoUrl = cfg['logos.uso.pdf'] === 'Secundario' ? cfg['logos.secundario'] : cfg['logos.principal']

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="cotizacion-${quote.id.slice(-6)}.pdf"`)
    const stream = await renderToStream(
      React.createElement(QuotePdfDocument, { quote, logoUrl: logoUrl || null }),
    )
    stream.pipe(res)
  } catch (e) {
    console.error('[quotes PDF]', e)
    return res.status(500).json({ error: 'Error al generar PDF' })
  }
})

router.get('/:id/excel', async (req, res) => {
  try {
    const quote = await loadQuoteFull(req.params.id)
    if (!quote) return res.status(404).json({ error: 'Quote not found' })

    const headerAoa = [
      ['Folio', `COT-${quote.id.slice(-6).toUpperCase()}`],
      ['Fecha', new Date(quote.createdAt).toLocaleDateString('es-MX')],
      ['Estado', quote.status],
      ['Cliente', quote.client.name],
      ['Empresa', quote.client.company || ''],
      ['Email', quote.client.email],
      ['Teléfono', quote.client.phone || ''],
      ['Vendedor', quote.seller?.name || 'N/A'],
      ['Notas', quote.notes || ''],
      [],
    ]

    const rows = quote.items.map((item) => ({
      Código: itemCode(item),
      Concepto: itemName(item),
      'Técnica': item.printTechnique || '',
      Cantidad: item.quantity,
      'Precio unitario': parseFloat(item.unitPrice),
      Subtotal: parseFloat(item.subtotal),
    }))
    rows.push({}, { Concepto: 'Subtotal', Subtotal: parseFloat(quote.subtotal) })
    rows.push({ Concepto: 'IVA (16%)', Subtotal: parseFloat(quote.iva) })
    rows.push({ Concepto: 'Total', Subtotal: parseFloat(quote.total) })

    const sheet = XLSX.utils.aoa_to_sheet(headerAoa)
    XLSX.utils.sheet_add_json(sheet, rows, { origin: headerAoa.length, skipHeader: false })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'Cotización')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="cotizacion-${quote.id.slice(-6)}.xlsx"`)
    res.send(buffer)
  } catch (e) {
    console.error('[quotes Excel]', e)
    return res.status(500).json({ error: 'Error al generar Excel' })
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
