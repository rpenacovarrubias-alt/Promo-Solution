/**
 * Adaptador: Promo Option (promocionalesenlinea.net)
 * Auth: GraphQL mutation login → Bearer JWT (expira 24hrs)
 * Almacena el token en Config para reusar sin re-login innecesario
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

async function fetchProducts(token) {
  // Query productos del catálogo
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `query {
        products {
          id
          name
          description
          price
          stock
          category
          images { url isPrimary }
          colors { name hex }
          variants { size material minQty }
        }
      }`,
    }),
  })

  const json = await res.json()
  if (json.errors) throw new Error(`Promo Option query falló: ${JSON.stringify(json.errors)}`)

  return json.data?.products || []
}

function normalize(raw) {
  return {
    externalId: String(raw.id),
    name: raw.name || '',
    description: raw.description || null,
    basePrice: parseFloat(raw.price) || 0,
    stock: raw.stock != null ? parseInt(raw.stock) : null,
    images: (raw.images || []).map(img => ({ url: img.url, isPrimary: img.isPrimary || false })),
    colors: (raw.colors || []).map(c => ({ colorName: c.name, hex: c.hex || null })),
    variants: (raw.variants || []).map(v => ({
      size: v.size || null,
      material: v.material || null,
      minQty: parseInt(v.minQty) || 1,
    })),
    rawCategory: raw.category || null,
  }
}

export async function sync(prisma, provider) {
  const token = await getToken(prisma, provider.apiUser, provider.apiPassword)
  const rawProducts = await fetchProducts(token)
  return rawProducts.map(normalize)
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
