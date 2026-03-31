/**
 * Adaptador: Innovation (innovation.com.mx)
 * Auth: Bearer token pre-emitido (almacenado en Provider.apiKey)
 * Plataforma: Bubble.io — API REST en /api/1.1/
 */

const BASE_URL = 'https://innovation.com.mx/api/1.1'

async function fetchPage(token, cursor = null) {
  const url = new URL(`${BASE_URL}/obj/Product`)
  url.searchParams.set('limit', '100')
  if (cursor) url.searchParams.set('cursor', cursor)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Innovation API error ${res.status}: ${text}`)
  }

  return res.json()
}

function normalize(raw) {
  return {
    externalId: raw._id || raw.id || String(Math.random()),
    name: raw['Name'] || raw['name'] || raw['Nombre'] || '',
    description: raw['Description'] || raw['Descripcion'] || raw['description'] || null,
    basePrice: parseFloat(raw['Price'] || raw['Precio'] || raw['price'] || 0),
    stock: raw['Stock'] != null ? parseInt(raw['Stock']) : null,
    images: raw['Image'] ? [{ url: raw['Image'], isPrimary: true }] : [],
    colors: [],
    variants: [],
    rawCategory: raw['Category'] || raw['Categoria'] || null,
  }
}

export async function sync(prisma, provider) {
  const token = provider.apiKey
  if (!token) throw new Error('Innovation requiere apiKey (Bearer token)')

  const results = []
  let cursor = null

  do {
    const page = await fetchPage(token, cursor)
    const items = page.response?.results || []
    results.push(...items.map(normalize))
    cursor = page.response?.remaining > 0 ? page.response?.cursor : null
  } while (cursor)

  return results
}

export async function testConnection(apiKey) {
  const res = await fetch(`${BASE_URL}/obj/Product?limit=1`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!res.ok) throw new Error(`Error ${res.status}: token inválido o sin acceso`)
  return { ok: true, message: 'Conexión exitosa con Innovation' }
}
