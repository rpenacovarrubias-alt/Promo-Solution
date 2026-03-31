/**
 * Re-exporta los tipos y helpers de la API pública.
 * Mantenemos este archivo por compatibilidad con imports existentes
 * mientras se migran todos los componentes.
 */
export type {
  ApiProduct      as Producto,
  ApiProduct      as ProductoDetalle,
  ApiCategory     as Categoria,
  ApiProductsResponse,
} from './api'

export {
  getProductImageUrl as getImageUrl,
  getMinQty,
  formatPrecio,
} from './api'
