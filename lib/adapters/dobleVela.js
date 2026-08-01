/**
 * Adaptador: Doble Vela (doblevela.com)
 * Auth: llave única ("Key de acceso") como query param — sin login,
 * confirmado 2026-07-27 vía WSDL real + prueba directa contra
 * http://srv-datos.dyndns.info/doblevela/service.asmx (ASMX/.NET,
 * binding HTTP GET). El adaptador anterior apuntaba a un dominio y
 * flujo de login que ya no existen.
 *
 * Métodos reales (confirmados por WSDL):
 *   GetExistencia(codigo, Key)     -> variantes de UN modelo (codigo = MODELO, no CLAVE)
 *   GetExistenciaAll(Key)          -> catálogo completo (2,478 variantes, sin paginación)
 *   GetrProdImagenes(Codigo, Key)  -> no usado; las imágenes se arman por URL (ver abajo)
 *
 * Respuesta: XML con un <string> que envuelve un JSON crudo:
 *   {"intCodigo":0,"strMensaje":"","Resultado":[ {...fila...}, ... ]}
 *   intCodigo 101 + "Acceso no permitido." = Key inválida.
 *
 * Imágenes: la API NO regresa URLs de imagen. Se construyen con la
 * nomenclatura confirmada por Doble Vela (archivo "Explicación de
 * nomenclatura de imágenes por URL", verificada contra el listado real
 * "URL'S IMÁGENES DOBLE VELA_171225" — coincide en todas las muestras):
 *   Grupal:     https://doblevela.com/images/large/{MODELO}_lrg.jpg
 *   Por color:  https://doblevela.com/images/large/{MODELO}_{colorSlug}_lrg.jpg
 *   colorSlug = nombre de color sin el prefijo "NN - ", en minúsculas,
 *   sin acentos ni espacios (ej. "08 - Verde claro" -> "verdeclaro").
 */

const BASE_URL = 'http://srv-datos.dyndns.info/doblevela/service.asmx'

async function call(method, key, params = {}) {
  const url = new URL(`${BASE_URL}/${method}`)
  url.searchParams.set('Key', key)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Doble Vela: HTTP ${res.status}`)

  const xml = await res.text()
  const match = xml.match(/<string[^>]*>([\s\S]*)<\/string>/)
  if (!match) throw new Error('Doble Vela: respuesta inesperada (sin envelope <string>)')

  const json = JSON.parse(match[1])
  if (json.intCodigo !== 0) throw new Error(`Doble Vela: ${json.strMensaje || `código ${json.intCodigo}`}`)
  return json.Resultado || []
}

// "08 - Verde claro" -> "verdeclaro"
function colorSlug(rawColor) {
  if (!rawColor) return null
  const name = rawColor.replace(/^\d+\s*-\s*/, '')
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function colorName(rawColor) {
  return rawColor ? rawColor.replace(/^\d+\s*-\s*/, '').trim() : null
}

// "TECNOLOGÍA" -> "Tecnología"
function humanizeCategory(raw) {
  if (!raw) return null
  return raw
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Statuses confirmados como "no vender": D (descontinuado), NC (no cotizar).
// Las variantes O5%/O10%/etc son ofertas activas, no se excluyen.
const INACTIVE_STATUS = new Set(['D', 'NC'])

function normalizeItem(raw) {
  const modelo = raw.MODELO
  const slug = colorSlug(raw.COLOR)
  const hasRealStockAndPrice = (raw.EXISTENCIAS ?? 0) > 0 && parseFloat(raw.Price) > 0
  const isActive = hasRealStockAndPrice && !INACTIVE_STATUS.has(raw.Status)

  const images = [{ url: `https://doblevela.com/images/large/${modelo}_lrg.jpg`, isPrimary: true }]
  if (slug) images.push({ url: `https://doblevela.com/images/large/${modelo}_${slug}_lrg.jpg`, isPrimary: false })

  return {
    externalId: raw.CLAVE,
    name: raw.NOMBRE || '',
    description: raw.Descripcion || null,
    basePrice: parseFloat(raw.Price) || 0,
    stock: raw.EXISTENCIAS != null ? parseInt(raw.EXISTENCIAS) : null,
    isActive,
    images,
    colors: raw.COLOR ? [{ colorName: colorName(raw.COLOR), hex: null }] : [],
    variants: [],
    rawCategory: humanizeCategory(raw.Familia),
  }
}

export async function sync(prisma, provider) {
  const key = provider.apiKey
  if (!key) throw new Error('Doble Vela requiere la Key de acceso')

  const items = await call('GetExistenciaAll', key)
  return items.map(normalizeItem)
}

export async function testConnection(apiKey) {
  // GetExistencia con un modelo cualquiera es más liviano que traer las
  // 2,478 variantes solo para validar la llave; cualquier respuesta con
  // intCodigo 0 confirma que la Key es válida, exista o no ese modelo.
  await call('GetExistencia', apiKey, { codigo: 'TEST' })
  return { ok: true, message: 'Conexión exitosa con Doble Vela' }
}
