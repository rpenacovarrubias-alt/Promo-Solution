/**
 * Adaptador: 4 Promotional (4promotional.net)
 * Auth: Bearer token (visible en portal del usuario)
 *       Se almacena en Provider.apiKey
 * Nota: Si el token expira, actualizar en panel de proveedores
 */

const BASE_URL = 'https://4promotional.net/api'

async function fetchPage(token, accountId, page = 1) {
  const res = await fetch(`${BASE_URL}/products?page=${page}&per_page=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Customer-ID': accountId || '',
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`4Promotional API error ${res.status}: ${text}`)
  }

  return res.json()
}

function normalize(raw) {
  const images = []
  if (raw.image || raw.imagen) images.push({ url: raw.image || raw.imagen, isPrimary: true })
  if (Array.isArray(raw.images)) {
    raw.images.forEach((img, i) => images.push({ url: img.url || img, isPrimary: i === 0 }))
  }

  return {
    externalId: String(raw.id || raw.code || raw.codigo || ''),
    name: raw.name || raw.nombre || '',
    description: raw.description || raw.descripcion || null,
    basePrice: parseFloat(raw.price || raw.precio || raw.unit_price || 0),
    stock: raw.stock != null ? parseInt(raw.stock) : null,
    images,
    colors: (raw.colors || raw.colores || []).map(c => ({
      colorName: c.name || c.nombre || c,
      hex: c.hex || null,
    })),
    variants: (raw.variants || raw.variantes || []).map(v => ({
      size: v.size || v.talla || null,
      material: v.material || null,
      minQty: parseInt(v.min_qty || v.minima || 1),
    })),
    rawCategory: raw.category || raw.categoria || null,
  }
}

export async function sync(prisma, provider) {
  const token = provider.apiKey
  if (!token) throw new Error('4Promotional requiere apiKey (Bearer token del portal)')

  const results = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const data = await fetchPage(token, provider.accountId, page)
    const items = data.data || data.products || data.items || data || []

    if (!Array.isArray(items) || items.length === 0) {
      hasMore = false
    } else {
      results.push(...items.map(normalize))
      hasMore = data.next_page != null || data.has_more === true || items.length === 100
      page++
    }
  }

  return results
}

export async function testConnection(apiKey, accountId) {
  const res = await fetch(`${BASE_URL}/products?page=1&per_page=1`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'X-Customer-ID': accountId || '',
    },
  })

  if (!res.ok) throw new Error(`Error ${res.status}: token inválido o sin permisos`)
  return { ok: true, message: 'Conexión exitosa con 4 Promotional' }
}
