// Único criterio de folio para cotizaciones — antes había dos (uno basado en el
// ID de la cotización en el PDF, otro secuencial por conteo en lib/quotes.js).
// Se usa el ID propio de la cotización porque es estable desde el momento en
// que se crea (un folio por conteo cambia si se borra una cotización anterior).
export function folio(quoteId) {
  return `COT-${quoteId.slice(-6).toUpperCase()}`
}
