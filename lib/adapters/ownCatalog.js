/**
 * Adaptador: Catálogo Propio Promo Solution (uniformes)
 * Auth: ninguna — importación manual desde Excel
 * Columnas del Excel:
 *   Código, Colores, Nombre, Descripción, Precio Unitario,
 *   Área de impresión, Categorías, Técnica de impresión, etc.
 */

export function normalizeExcelRow(row) {
  const colors = String(row['Colores'] || '')
    .split('|')
    .map(c => c.trim())
    .filter(Boolean)
    .map(name => ({ colorName: name, hex: null }))

  return {
    externalId: String(row['Código'] || row['Codigo'] || '').trim(),
    name: String(row['Nombre'] || '').trim(),
    description: String(row['Descripción'] || row['Descripcion'] || '').trim() || null,
    basePrice: parseFloat(String(row['Precio Unitario'] || '0').replace(/[^0-9.]/g, '')) || 0,
    stock: null,
    images: [],
    colors,
    variants: [],
    rawCategory: String(row['Categorías'] || row['Categorias'] || '').split('|').pop()?.trim() || null,
  }
}

export async function sync(prisma, provider) {
  // El catálogo propio se importa vía upload en el panel, no vía sync automática
  throw new Error('El catálogo propio se importa manualmente desde el panel de proveedores')
}

export async function testConnection() {
  return { ok: true, message: 'Catálogo propio — importación manual disponible' }
}
