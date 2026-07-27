/**
 * Adaptador: Promo Option (promocionalesenlinea.net)
 * Auth: GraphQL mutation login → Bearer JWT (expira 24hrs)
 * Almacena el token en Config para reusar sin re-login innecesario
 *
 * Schema actualizado (2026-07-27, verificado por introspección — el query
 * "products" que usaba esta integración antes de hoy ya no existe):
 *   distribuitorProductCatalog(page: Int!): PaginatedProducts { hasNextPage, data: [ProductDetail] }
 *   ProductDetail { productModel: ProductModel, variants: [Variants] }
 * Cada "variant" es en realidad una variante de color con su propio SKU,
 * precio e imágenes — no hay un precio/stock único a nivel producto. Por
 * eso cada variant se sube como un Product independiente (mismo patrón que
 * ya usa upsertProducts: una fila por externalId). La API tampoco expone
 * cantidad de stock numérica, solo disponible/no disponible por región.
 */

const GRAPHQL_URL = 'https://www.promocionalesenlinea.net/graphql'

async function getToken(prisma, apiUser, apiPassword) {
  // Intentar reusar token guardado
  const stored = await prisma.config.findUnique({ where: { key: 'promo_option_token' } })
  if (stored) {
    const { token, expiresAt } = JSON.parse(stored.value)
    if (new Date(expiresAt) > new Date()) return token
  }

  // Login para obtener nuevo token
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          message
          accessToken
        }
      }`,
      variables: { email: apiUser, password: apiPassword },
    }),
  })

  const json = await res.json()
  if (json.errors || !json.data?.login?.accessToken) {
    throw new Error(`Promo Option login falló: ${JSON.stringify(json.errors || json.data)}`)
  }

  const token = json.data.login.accessToken
  const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000) // 23 hrs para margen

  await prisma.config.upsert({
    where: { key: 'promo_option_token' },
    update: { value: JSON.stringify({ token, expiresAt }) },
    create: { key: 'promo_option_token', value: JSON.stringify({ token, expiresAt }) },
  })

  return token
}

const CATALOG_QUERY = `query($page: Int!) {
  distribuitorProductCatalog(page: $page) {
    hasNextPage
    data {
      productModel { sku nameProductModel descriptionMx }
      variants {
        sku
        name
        color
        size
        pricing { priceMx { amount } }
        mediaAssets { variantImages }
      }
    }
  }
}`

async function fetchPage(token, page) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: CATALOG_QUERY, variables: { page } }),
  })

  const json = await res.json()
  if (json.errors) throw new Error(`Promo Option query falló: ${JSON.stringify(json.errors)}`)
  return json.data?.distribuitorProductCatalog
}

// Promo Option usa 99999999 como centinela de "sin precio disponible" en vez
// de null — sin este filtro esos productos se venderían mostrando un precio
// de $99,999,999 MXN.
const PRICE_SENTINEL = 99999999

function normalizeVariant(productModel, variant) {
  const rawPrice = parseFloat(variant.pricing?.priceMx?.[0]?.amount) || 0
  const hasRealPrice = rawPrice > 0 && rawPrice < PRICE_SENTINEL

  return {
    externalId: variant.sku || productModel.sku,
    name: variant.name || productModel.nameProductModel || '',
    description: productModel.descriptionMx || null,
    basePrice: hasRealPrice ? rawPrice : 0,
    stock: null,
    isActive: hasRealPrice,
    images: (variant.mediaAssets?.variantImages || []).map((url, i) => ({ url, isPrimary: i === 0 })),
    colors: variant.color ? [{ colorName: variant.color, hex: null }] : [],
    variants: variant.size ? [{ size: variant.size, material: null, minQty: 1 }] : [],
    rawCategory: null,
  }
}

export async function sync(prisma, provider) {
  const token = await getToken(prisma, provider.apiUser, provider.apiPassword)

  const results = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const catalog = await fetchPage(token, page)
    if (!catalog) break

    for (const item of catalog.data || []) {
      for (const variant of item.variants || []) {
        results.push(normalizeVariant(item.productModel, variant))
      }
    }

    hasNextPage = catalog.hasNextPage === true
    page++
  }

  return results
}

export async function testConnection(apiUser, apiPassword) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) { message accessToken }
      }`,
      variables: { email: apiUser, password: apiPassword },
    }),
  })
  const json = await res.json()
  if (json.errors || !json.data?.login?.accessToken) {
    throw new Error('Credenciales incorrectas o servicio no disponible')
  }
  return { ok: true, message: 'Conexión exitosa con Promo Option' }
}
