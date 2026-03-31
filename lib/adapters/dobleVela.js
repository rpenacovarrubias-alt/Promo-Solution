/**
 * Adaptador: Doble Vela (doblevela.com)
 * Auth: Login con usuario/contraseña → token de sesión → Web Service
 * Cuenta: C010535
 */

const BASE_URL = 'https://www.doblevela.com'

async function login(apiUser, apiPassword, accountId) {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: apiUser, password: apiPassword, cuenta: accountId }),
  })

  if (!res.ok) {
    // Intentar con form-data si JSON no funciona
    const form = new URLSearchParams()
    form.append('email', apiUser)
    form.append('password', apiPassword)
    if (accountId) form.append('cuenta', accountId)

    const res2 = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })

    if (!res2.ok) throw new Error(`Doble Vela login falló: ${res2.status}`)
    const json2 = await res2.json()
    return json2.token || json2.access_token || json2.accessToken
  }

  const json = await res.json()
  return json.token || json.access_token || json.accessToken
}

async function fetchCatalog(token) {
  const res = await fetch(`${BASE_URL}/herramientas/tvws/api/productos`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error(`Doble Vela catálogo error: ${res.status}`)
  return res.json()
}

function normalize(raw) {
  const images = []
  if (raw.imagen || raw.image) images.push({ url: raw.imagen || raw.image, isPrimary: true })
  if (Array.isArray(raw.imagenes || raw.images)) {
    ;(raw.imagenes || raw.images).forEach((img, i) =>
      images.push({ url: img.url || img, isPrimary: i === 0 })
    )
  }

  return {
    externalId: String(raw.id || raw.clave || raw.codigo || ''),
    name: raw.nombre || raw.name || '',
    description: raw.descripcion || raw.description || null,
    basePrice: parseFloat(raw.precio || raw.price || raw.precio_unitario || 0),
    stock: raw.existencia != null ? parseInt(raw.existencia) : raw.stock != null ? parseInt(raw.stock) : null,
    images,
    colors: (raw.colores || raw.colors || []).map(c => ({
      colorName: c.nombre || c.name || c,
      hex: c.hex || null,
    })),
    variants: (raw.tallas || raw.sizes || []).map(t => ({
      size: String(t.talla || t.size || t),
      material: null,
      minQty: parseInt(t.minimo || t.min_qty || 1),
    })),
    rawCategory: raw.categoria || raw.category || null,
  }
}

export async function sync(prisma, provider) {
  const token = await login(provider.apiUser, provider.apiPassword, provider.accountId)
  const data = await fetchCatalog(token)
  const items = data.productos || data.products || data.data || data
  if (!Array.isArray(items)) throw new Error('Doble Vela: respuesta inesperada del catálogo')
  return items.map(normalize)
}

export async function testConnection(apiUser, apiPassword, accountId) {
  const token = await login(apiUser, apiPassword, accountId)
  if (!token) throw new Error('No se recibió token de sesión')
  return { ok: true, message: 'Conexión exitosa con Doble Vela' }
}
