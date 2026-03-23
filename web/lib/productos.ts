export interface Producto {
  id: number
  codigo_proveedor: string
  codigo_prm: string | null
  nombre: string
  descripcion: string | null
  categoria_nombre: string | null
  precio_venta: number
  moneda: string
  colores: string[] | null
  tecnica_impresion: string[] | null
  medidas: string | null
  cantidad_minima: number
  tiempo_entrega: string | null
  imagen_principal: string | null
  imagenes: string[] | null
  disponible: boolean
  stock: number | null
  destacado: boolean
  tags: string[] | null
  proveedor_nombre: string
  proveedor_codigo: string
}

export interface ProductoDetalle extends Producto {
  peso: string | null
  materiales: string | null
  area_impresion: string | null
  ficha_tecnica_url: string | null
}

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? 'https://d23wkusc303ge3.cloudfront.net/XP45Ewd4'

/**
 * Genera la URL de imagen principal desde el código de proveedor.
 * Misma lógica que el workflow n8n actual.
 */
export function getImageUrl(codigoProveedor: string, imagenPrincipal?: string | null): string {
  if (imagenPrincipal && imagenPrincipal.startsWith('http')) {
    return imagenPrincipal
  }
  const slug = codigoProveedor.replace(/ /g, '-')
  return `${CDN}/_${slug}_.jpg`
}

export function formatPrecio(precio: number, moneda = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(precio)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
