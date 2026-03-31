/**
 * Cliente tipado para la API pública de Promo Solution.
 *
 * Variables de entorno:
 *   NEXT_PUBLIC_ADMIN_API — URL base del servidor Express (e.g. https://admin.promosolution.com.mx)
 *   PUBLIC_API_KEY        — clave para el header X-API-Key (solo server-side, sin NEXT_PUBLIC_)
 *
 * En producción los componentes de servidor usan PUBLIC_API_KEY directamente.
 * Los componentes de cliente llaman a las rutas Next.js /api/* que hacen el proxy.
 */

// ── Tipos exportados ──────────────────────────────────────────────────────────

export interface ApiProduct {
  id:          string
  name:        string
  description: string | null
  basePrice:   number
  finalPrice:  number
  isActive:    boolean
  isFeatured:  boolean
  stock:       number | null
  category:    { id: string; name: string } | null
  provider:    { id: string; name: string; slug: string } | null
  images:      { url: string; isPrimary: boolean }[]
  colors:      { name: string; hex: string | null }[]
  variants:    { size: string | null; material: string | null; minQty: number }[]
}

export interface ApiCategory {
  id:           string
  name:         string
  productCount: number
}

export interface ApiProvider {
  id:   string
  name: string
  slug: string
}

export interface ApiPagination {
  page:       number
  limit:      number
  total:      number
  totalPages: number
  hasNext:    boolean
  hasPrev:    boolean
}

export interface ApiProductsResponse {
  data:       ApiProduct[]
  pagination: ApiPagination
}

export interface ApiQuoteResponse {
  quoteId:   string
  folio:     string
  clientId:  string
  subtotal:  number
  iva:       number
  total:     number
  items:     ApiQuoteItem[]
  channel:   string
  createdAt: string
}

export interface ApiQuoteItem {
  productId:   string
  productName: string
  quantity:    number
  unitPrice:   number
  markup:      number
  subtotal:    number
}

// ── Helpers de presentación ───────────────────────────────────────────────────

/** Devuelve la URL de la imagen principal del producto, o el placeholder. */
export function getProductImageUrl(product: ApiProduct): string {
  return product.images[0]?.url ?? '/placeholder-product.png'
}

/** Cantidad mínima de pedido del producto. */
export function getMinQty(product: ApiProduct): number {
  return product.variants[0]?.minQty ?? 1
}

/** Formatea precio en pesos mexicanos. */
export function formatPrecio(price: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style:                 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price)
}

// ── Configuración del cliente ─────────────────────────────────────────────────

function getBase(): string {
  // En el servidor: puede usar la URL interna del contenedor Docker
  if (typeof window === 'undefined') {
    return (
      process.env.ADMIN_API_URL ??
      process.env.NEXT_PUBLIC_ADMIN_API ??
      'http://localhost:4000'
    )
  }
  // En el cliente: siempre la URL pública
  return process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:4000'
}

function getApiKey(): string {
  return process.env.PUBLIC_API_KEY ?? ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FetchInit = RequestInit & { next?: { revalidate?: number | false } }

async function apiFetch<T>(path: string, init?: FetchInit): Promise<T> {
  const url = `${getBase()}${path}`
  const res = await fetch(url, {
    // Next.js 14 cache: revalidar cada 60s (ignorado fuera de Next.js)
    next: { revalidate: 60 },
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getApiKey(),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err?.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Productos ─────────────────────────────────────────────────────────────────

export interface GetProductsParams {
  search?:    string
  categoryId?: string
  providerId?: string
  featured?:  boolean
  page?:      number
  limit?:     number
}

export async function getProducts(params: GetProductsParams = {}): Promise<ApiProductsResponse> {
  const qs = new URLSearchParams()
  if (params.search)     qs.set('search',     params.search)
  if (params.categoryId) qs.set('categoryId', params.categoryId)
  if (params.providerId) qs.set('providerId', params.providerId)
  if (params.featured)   qs.set('featured',   'true')
  if (params.page)       qs.set('page',       String(params.page))
  if (params.limit)      qs.set('limit',      String(params.limit))
  const query = qs.toString()
  return apiFetch<ApiProductsResponse>(`/api/public/products${query ? `?${query}` : ''}`)
}

export async function getProductById(id: string): Promise<ApiProduct | null> {
  try {
    return await apiFetch<ApiProduct>(`/api/public/products/${id}`)
  } catch {
    return null
  }
}

// ── Categorías ────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<ApiCategory[]> {
  return apiFetch<ApiCategory[]>('/api/public/categories')
}

// ── Proveedores ───────────────────────────────────────────────────────────────

export async function getProviders(): Promise<ApiProvider[]> {
  return apiFetch<ApiProvider[]>('/api/public/providers')
}

// ── Cotizaciones ──────────────────────────────────────────────────────────────

export interface CreateQuotePayload {
  customer: {
    name:     string
    phone:    string
    email?:   string
    company?: string
  }
  channel: 'TELEGRAM' | 'WHATSAPP' | 'CHAT' | 'EMAIL'
  items: { productId: string; quantity: number }[]
  notes?: string
}

export async function createQuote(payload: CreateQuotePayload): Promise<ApiQuoteResponse> {
  return apiFetch<ApiQuoteResponse>('/api/public/quotes', {
    method: 'POST',
    body: JSON.stringify(payload),
    next: { revalidate: false },
  })
}
