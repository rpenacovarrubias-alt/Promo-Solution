import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { folio } from '../folio.js'

const NAVY = '#17264A'
const NAVY_2 = '#1F3363'
const GOLD = '#C9A15A'

// El header/footer son degradados blanco -> azul: el logo y el texto de marca
// viven en el tramo blanco (legible aunque el logo no tenga versión clara) y el
// folio/paginación viven en el tramo azul con texto claro. Ver design-demos/
// cotizador-header-footer-mockup.html para la referencia visual aprobada.
const styles = StyleSheet.create({
  page: { fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
  },
  logo: { height: 30, objectFit: 'contain' },
  logoFallback: { color: NAVY, fontSize: 15, fontWeight: 700 },
  doc: { alignItems: 'flex-end' },
  docLabel: { fontSize: 8, color: GOLD, fontWeight: 700, letterSpacing: 1, marginBottom: 3 },
  folioText: { fontSize: 16, fontWeight: 700, color: '#fff' },
  dateText: { fontSize: 8.5, color: '#c7cede', marginTop: 4 },

  body: { paddingHorizontal: 32, paddingTop: 20, paddingBottom: 10 },
  section: { marginBottom: 14 },
  label: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 10, marginBottom: 4 },

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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  thImg: { width: 30 },
  thConcepto: { flex: 2.6, fontSize: 7.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' },
  thTecnica: { flex: 1.4, fontSize: 7.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' },
  thCant: { flex: 0.7, fontSize: 7.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' },
  thPrecio: { flex: 1, fontSize: 7.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' },
  thSubtotal: { flex: 1, fontSize: 7.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' },

  tdImgCell: { width: 30 },
  tdImg: { width: 24, height: 24, borderRadius: 3, objectFit: 'cover' },
  tdImgPlaceholder: { width: 24, height: 24, borderRadius: 3, backgroundColor: '#eef0f3' },
  tdConcepto: { flex: 2.6, fontSize: 9 },
  tdSub: { fontSize: 7, color: '#6b7280' },
  tdTecnica: { flex: 1.4, fontSize: 8.5 },
  tdTecnicaCost: { fontSize: 7, color: '#6b7280', marginTop: 1 },
  tdCant: { flex: 0.7, fontSize: 9, textAlign: 'right' },
  tdPrecio: { flex: 1, fontSize: 9, textAlign: 'right' },
  tdSubtotal: { flex: 1, fontSize: 9, textAlign: 'right', fontWeight: 700 },

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
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  footerBrand: { fontSize: 8, fontWeight: 700, color: NAVY },
  footerContact: { fontSize: 7.5, color: '#6b7280', marginTop: 1 },
  footerPage: { fontSize: 8, fontWeight: 700, color: '#fff' },
})

// Helvetica (fuente estandar del PDF) no tiene glifos para emoji ni simbolos fuera
// de Latin-1 - sin este filtro salen como caracteres corruptos en el PDF.
const SAFE_CHARS = /[^\x20-\x7E -ÿ\n]/g
const sanitizeText = (s) => (s ? s.replace(SAFE_CHARS, '').trim() : s)

const fmt = (n) => `$${parseFloat(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (d) => new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })

function itemName(item) {
  return item.product?.name ?? item.service?.name ?? 'Item'
}

function itemImage(item) {
  return item.product?.images?.[0]?.url ?? null
}

// Nombre de la técnica: prioriza la relación estructurada (Service, con costo
// congelado en printUnitCost); si el item es de una cotización vieja que solo
// tiene el texto libre, lo muestra igual pero sin costo (no existe ese dato).
function techniqueName(item) {
  return item.service?.name ?? item.printTechnique ?? null
}

// react-pdf 4.x no soporta gradientes SVG (Defs/LinearGradient/Stop no están
// implementados en su motor de layout) — se aproxima el degradado blanco->azul
// del mockup aprobado con una tira de bandas verticales de color interpolado,
// como fondo absoluto detrás del contenido real del header/footer.
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}
function colorAtStop(stops, t) {
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (t >= a.offset && t <= b.offset) {
      const localT = b.offset === a.offset ? 0 : (t - a.offset) / (b.offset - a.offset)
      const ca = hexToRgb(a.color)
      const cb = hexToRgb(b.color)
      return rgbToHex(ca.map((v, i2) => v + (cb[i2] - v) * localT))
    }
  }
  return stops[stops.length - 1].color
}

const GRADIENT_BANDS = 48
function GradientBackground({ stops }) {
  const e = React.createElement
  const bandWidth = 100 / GRADIENT_BANDS
  return e(
    View,
    { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' } },
    ...Array.from({ length: GRADIENT_BANDS }, (_, i) =>
      e(View, {
        key: i,
        style: {
          width: `${bandWidth}%`,
          backgroundColor: colorAtStop(stops, i / (GRADIENT_BANDS - 1)),
        },
      }),
    ),
  )
}

const HEADER_STOPS = [
  { offset: 0, color: '#ffffff' },
  { offset: 0.38, color: '#ffffff' },
  { offset: 0.74, color: NAVY },
  { offset: 1, color: NAVY_2 },
]
const FOOTER_STOPS = [
  { offset: 0, color: '#ffffff' },
  { offset: 0.62, color: '#ffffff' },
  { offset: 0.88, color: NAVY },
  { offset: 1, color: NAVY_2 },
]

export function QuotePdfDocument({ quote, logoUrl }) {
  const e = React.createElement
  return e(
    Document,
    null,
    e(
      Page,
      { size: 'A4', style: styles.page },

      // Header
      e(
        View,
        { style: { position: 'relative' }, fixed: true },
        e(GradientBackground, { stops: HEADER_STOPS }),
        e(
          View,
          { style: styles.header },
          logoUrl ? e(Image, { src: logoUrl, style: styles.logo }) : e(Text, { style: styles.logoFallback }, 'PROMO SOLUTION'),
          e(
            View,
            { style: styles.doc },
            e(Text, { style: styles.docLabel }, 'COTIZACIÓN'),
            e(Text, { style: styles.folioText }, folio(quote.id)),
            e(Text, { style: styles.dateText }, fmtDate(quote.createdAt)),
          ),
        ),
      ),

      e(
        View,
        { style: styles.body },

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
            e(View, { style: styles.thImg }),
            e(Text, { style: styles.thConcepto }, 'Producto'),
            e(Text, { style: styles.thTecnica }, 'Técnica'),
            e(Text, { style: styles.thCant }, 'Cant.'),
            e(Text, { style: styles.thPrecio }, 'P. unitario'),
            e(Text, { style: styles.thSubtotal }, 'Subtotal'),
          ),
          ...quote.items.map((item) => {
            const imgUrl = itemImage(item)
            const technique = techniqueName(item)
            const printCost = parseFloat(item.printUnitCost ?? 0)
            return e(
              View,
              { key: item.id, style: styles.tableRow },
              e(
                View,
                { style: styles.tdImgCell },
                imgUrl ? e(Image, { src: imgUrl, style: styles.tdImg }) : e(View, { style: styles.tdImgPlaceholder }),
              ),
              e(
                View,
                { style: styles.tdConcepto },
                e(Text, null, sanitizeText(itemName(item))),
                item.product?.externalId ? e(Text, { style: styles.tdSub }, sanitizeText(item.product.externalId)) : null,
              ),
              e(
                View,
                { style: styles.tdTecnica },
                technique
                  ? e(Text, null, sanitizeText(technique))
                  : e(Text, { style: styles.tdSub }, '—'),
                technique && printCost > 0
                  ? e(Text, { style: styles.tdTecnicaCost }, `${fmt(printCost)} c/u`)
                  : null,
              ),
              e(Text, { style: styles.tdCant }, String(item.quantity)),
              e(Text, { style: styles.tdPrecio }, fmt(item.unitPrice)),
              e(Text, { style: styles.tdSubtotal }, fmt(item.subtotal)),
            )
          }),
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
      ),

      // Footer — degradado blanco->azul en espejo con el header, fijo en cada página.
      e(
        View,
        { style: styles.footer, fixed: true, render: ({ pageNumber, totalPages }) =>
          e(
            View,
            { style: { position: 'relative' } },
            e(GradientBackground, { stops: FOOTER_STOPS }),
            e(
              View,
              { style: styles.footerStrip },
              e(
                View,
                null,
                e(Text, { style: styles.footerBrand }, 'Promo Solution'),
                e(Text, { style: styles.footerContact }, 'ventas@promosolution.com.mx  ·  442 131 4203  ·  promosolution.com.mx'),
              ),
              e(Text, { style: styles.footerPage }, `Página ${pageNumber} de ${totalPages}`),
            ),
          ),
        },
      ),
    ),
  )
}
