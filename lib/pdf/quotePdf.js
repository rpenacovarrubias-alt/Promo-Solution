import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'

const NAVY = '#17264A'
const GOLD = '#C9A15A'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: NAVY,
    padding: 16,
    marginBottom: 20,
    borderRadius: 4,
  },
  logo: { height: 32, objectFit: 'contain' },
  headerText: { color: '#fff' },
  folio: { fontSize: 16, fontWeight: 700 },
  folioLabel: { fontSize: 9, color: GOLD, marginTop: 2 },
  section: { marginBottom: 14 },
  label: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 10, marginBottom: 6 },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F7F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  thConcepto: { flex: 3, fontSize: 8, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' },
  thCant: { flex: 1, fontSize: 8, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' },
  thPrecio: { flex: 1.2, fontSize: 8, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' },
  thSubtotal: { flex: 1.2, fontSize: 8, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' },
  tdConcepto: { flex: 3, fontSize: 9 },
  tdSub: { fontSize: 7, color: '#6b7280' },
  tdCant: { flex: 1, fontSize: 9, textAlign: 'right' },
  tdPrecio: { flex: 1.2, fontSize: 9, textAlign: 'right' },
  tdSubtotal: { flex: 1.2, fontSize: 9, textAlign: 'right', fontWeight: 700 },
  totals: { marginTop: 16, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', marginBottom: 3 },
  totalLabel: { fontSize: 9, color: '#6b7280' },
  totalValue: { fontSize: 9, fontWeight: 700 },
  grandTotalRow: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 700 },
  grandTotalValue: { fontSize: 11, fontWeight: 700, color: NAVY },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
})

// Helvetica (fuente estandar del PDF) no tiene glifos para emoji ni simbolos fuera
// de Latin-1 - sin este filtro salen como caracteres corruptos en el PDF.
const SAFE_CHARS = /[^\x20-\x7E -ÿ\n]/g
const sanitizeText = (s) => (s ? s.replace(SAFE_CHARS, '').trim() : s)

const fmt = (n) => `$${parseFloat(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (d) => new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
const folio = (id) => `COT-${id.slice(-6).toUpperCase()}`

function itemName(item) {
  return item.product?.name ?? item.service?.name ?? 'Item'
}

export function QuotePdfDocument({ quote, logoUrl, footerInfo }) {
  const e = React.createElement
  return e(
    Document,
    null,
    e(
      Page,
      { size: 'A4', style: styles.page },
      e(
        View,
        { style: styles.header },
        logoUrl ? e(Image, { src: logoUrl, style: styles.logo }) : e(Text, { style: { color: '#fff', fontSize: 16, fontWeight: 700 } }, 'PROMO SOLUTION'),
        e(
          View,
          { style: { alignItems: 'flex-end' } },
          e(Text, { style: styles.folio }, folio(quote.id)),
          e(Text, { style: styles.folioLabel }, fmtDate(quote.createdAt)),
        ),
      ),
      e(
        View,
        { style: [styles.section, { flexDirection: 'row', justifyContent: 'space-between' }] },
        e(
          View,
          null,
          e(Text, { style: styles.label }, 'Cliente'),
          e(Text, { style: styles.value }, sanitizeText(quote.client.name)),
          quote.client.company ? e(Text, { style: styles.value }, sanitizeText(quote.client.company)) : null,
          e(Text, { style: styles.value }, quote.client.email),
        ),
      ),
      quote.notes ? e(
        View,
        { style: styles.section },
        e(Text, { style: styles.label }, 'Notas'),
        e(Text, { style: styles.value }, sanitizeText(quote.notes)),
      ) : null,
      e(
        View,
        { style: styles.table },
        e(
          View,
          { style: styles.tableHeader },
          e(Text, { style: styles.thConcepto }, 'Concepto'),
          e(Text, { style: styles.thCant }, 'Cant.'),
          e(Text, { style: styles.thPrecio }, 'P. unitario'),
          e(Text, { style: styles.thSubtotal }, 'Subtotal'),
        ),
        ...quote.items.map((item) =>
          e(
            View,
            { key: item.id, style: styles.tableRow },
            e(
              View,
              { style: styles.tdConcepto },
              e(Text, null, sanitizeText(itemName(item))),
              item.printTechnique ? e(Text, { style: styles.tdSub }, sanitizeText(item.printTechnique)) : null,
            ),
            e(Text, { style: styles.tdCant }, String(item.quantity)),
            e(Text, { style: styles.tdPrecio }, fmt(item.unitPrice)),
            e(Text, { style: styles.tdSubtotal }, fmt(item.subtotal)),
          ),
        ),
      ),
      e(
        View,
        { style: styles.totals },
        e(
          View,
          { style: styles.totalRow },
          e(Text, { style: styles.totalLabel }, 'Subtotal'),
          e(Text, { style: styles.totalValue }, fmt(quote.subtotal)),
        ),
        e(
          View,
          { style: styles.totalRow },
          e(Text, { style: styles.totalLabel }, 'IVA (16%)'),
          e(Text, { style: styles.totalValue }, fmt(quote.iva)),
        ),
        e(
          View,
          { style: styles.grandTotalRow },
          e(Text, { style: styles.grandTotalLabel }, 'Total'),
          e(Text, { style: styles.grandTotalValue }, fmt(quote.total)),
        ),
      ),
      footerInfo ? e(Text, { style: styles.footer }, sanitizeText(footerInfo)) : null,
    ),
  )
}
