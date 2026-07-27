/**
 * Adaptador: Innovation Line
 * Auth: User + Clave como query params, más un header `auth-token` fijo
 * (secreto de la app en API Gateway, no específico del cliente — confirmado
 * por la colección Postman "web service INNOVATION LINE AWS", 2026-07-27).
 * Plataforma: AWS API Gateway + Lambda — cada endpoint tiene su propio host.
 *
 * IMPORTANTE: el servicio reporta ventanas de disponibilidad ("Fuera de
 * horario") independientes de si las credenciales son válidas. Un 403 con
 * Correct_Datos:true NO significa credenciales incorrectas.
 *
 * Confirmado por prueba directa (2026-07-27): auth válida, pero el
 * envelope de respuesta exitosa nunca se observó en vivo (servicio
 * inactivo en el momento de escribir esto) — el parseo de sync() se basa
 * en el envelope revelado por el propio error ({status, response}) y debe
 * confirmarse contra una respuesta real la primera vez que el servicio
 * esté activo.
 */

const AUTH_TOKEN = 'DKQb7tT9Vi8N93wm7FF0Mvn3Mvb6T8wSCnHrLgk7SJDQICK8CTi3SYeF9IiedBkk'

const ENDPOINTS = {
  productos: 'https://4vumtdis3m.execute-api.us-east-1.amazonaws.com/default/Innovation_GetAllProductos',
  variantes: 'https://9tlzim70va.execute-api.us-east-1.amazonaws.com/default/Innovation_GetAllVariantes',
  categorias: 'https://l8g7ouqzdh.execute-api.us-east-1.amazonaws.com/default/Innovation_GetAllCategorias',
}

async function call(url, user, clave, params = {}) {
  const u = new URL(url)
  u.searchParams.set('User', user)
  u.searchParams.set('Clave', clave)
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v))

  const res = await fetch(u.toString(), { headers: { 'auth-token': AUTH_TOKEN } })
  const json = await res.json().catch(() => null)

  if (json?.error) {
    const status = json.respuesta_llave?.response?.Status
    const activo = json.respuesta_llave?.response?.Activo
    const datosOk = json.respuesta_llave?.response?.Correct_Datos
    if (datosOk === false) throw new Error('Innovation: usuario o clave incorrectos')
    throw new Error(`Innovation: ${status || json.error}${activo === false ? ' (servicio inactivo)' : ''}`)
  }
  if (!res.ok) throw new Error(`Innovation: HTTP ${res.status}`)
  return json
}

// La respuesta exitosa nunca se observó en vivo — se desenvuelve de forma
// defensiva probando las formas más probables dado el envelope de error
// conocido ({status, response}).
function unwrapList(json) {
  const candidates = [
    json?.response,
    json?.data,
    json,
  ]
  for (const c of candidates) {
    if (Array.isArray(c)) return c
    if (Array.isArray(c?.data)) return c.data
    if (Array.isArray(c?.Productos)) return c.Productos
    if (Array.isArray(c?.productos)) return c.productos
    if (Array.isArray(c?.items)) return c.items
    if (Array.isArray(c?.results)) return c.results
  }
  return []
}

function pick(obj, ...keys) {
  for (const k of keys) if (obj[k] != null && obj[k] !== '') return obj[k]
  return null
}

function normalizeProduct(raw) {
  return {
    externalId: String(pick(raw, 'Codigo', 'codigo', 'Sku', 'SKU', 'sku', 'Id', 'id') ?? ''),
    name: pick(raw, 'Nombre', 'nombre', 'Name', 'name') ?? '',
    description: pick(raw, 'Descripcion', 'descripcion', 'Description') ?? null,
    basePrice: parseFloat(pick(raw, 'Precio', 'precio', 'Price') ?? 0) || 0,
    stock: (() => {
      const s = pick(raw, 'Stock', 'stock', 'Existencia')
      return s != null ? parseInt(s) : null
    })(),
    images: (() => {
      const img = pick(raw, 'Imagen', 'imagen', 'Image')
      return img ? [{ url: img, isPrimary: true }] : []
    })(),
    colors: [],
    variants: [],
    rawCategory: pick(raw, 'Categoria', 'categoria', 'Category'),
  }
}

export async function sync(prisma, provider) {
  const { apiUser: user, apiPassword: clave } = provider
  if (!user || !clave) throw new Error('Innovation requiere usuario y contraseña')

  const results = []
  let page = 1
  const limit = 100
  let hasMore = true

  while (hasMore) {
    const json = await call(ENDPOINTS.productos, user, clave, { page, limit })
    const items = unwrapList(json)
    results.push(...items.map(normalizeProduct))
    hasMore = items.length === limit
    page++
    if (page > 500) break // guarda contra loop infinito si la paginación no coincide con lo esperado
  }

  return results
}

export async function testConnection(apiUser, apiPassword) {
  try {
    await call(ENDPOINTS.categorias, apiUser, apiPassword)
    return { ok: true, message: 'Conexión exitosa con Innovation' }
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('servicio inactivo') || msg.includes('Fuera de horario')) {
      return { ok: true, message: 'Credenciales válidas — el servicio de Innovation está fuera de horario ahora mismo, pero la conexión funcionará cuando esté activo.' }
    }
    throw e
  }
}
