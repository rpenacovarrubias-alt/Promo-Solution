/**
 * Sincronizador — Innovation
 * API Key: variable de entorno INNOVATION_API_KEY
 * Cuenta: PECJ680416PZ6
 */

import { query, queryOne } from '../web/lib/db'

const API_BASE = 'https://api.innovation.com.mx'
const API_KEY  = process.env.INNOVATION_API_KEY!
const CUENTA   = process.env.INNOVATION_CUENTA ?? 'PECJ680416PZ6'

interface InnovationProducto {
  codigo:      string
  nombre:      string
  descripcion: string
  categoria:   string
  precio:      number
  colores:     string[]
  imagenes:    string[]
  disponible:  boolean
  stock:       number
}

async function fetchProductos(page = 1): Promise<InnovationProducto[]> {
  const res = await fetch(`${API_BASE}/v1/products?page=${page}&per_page=100`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'X-Account': CUENTA,
      'Accept': 'application/json',
    },
  })

  if (!res.ok) throw new Error(`Innovation API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.products ?? data.data ?? []
}

export async function syncInnovation(): Promise<{
  nuevos: number; actualizados: number; errores: number
}> {
  const proveedor = await queryOne<{ id: number }>(
    `SELECT id FROM proveedores WHERE codigo = 'innovation'`
  )
  if (!proveedor) throw new Error('Proveedor innovation no encontrado en BD')

  let nuevos = 0, actualizados = 0, errores = 0
  let page = 1
  let hasMore = true

  while (hasMore) {
    const productos = await fetchProductos(page)
    if (productos.length === 0) { hasMore = false; break }

    for (const prod of productos) {
      try {
        const existing = await queryOne<{ id: number; precio_venta: number }>(
          `SELECT id, precio_venta FROM productos
           WHERE proveedor_id = $1 AND codigo_proveedor = $2`,
          [proveedor.id, prod.codigo]
        )

        const precio_venta = prod.precio * 1.40 // 40% margen por defecto

        if (!existing) {
          await query(
            `INSERT INTO productos
               (proveedor_id, codigo_proveedor, nombre, descripcion, categoria_nombre,
                precio_costo, precio_venta, colores, disponible, stock)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [proveedor.id, prod.codigo, prod.nombre, prod.descripcion,
             prod.categoria, prod.precio, precio_venta,
             prod.colores, prod.disponible, prod.stock]
          )
          nuevos++
        } else {
          await query(
            `UPDATE productos SET
               nombre = $3, descripcion = $4, categoria_nombre = $5,
               precio_costo = $6, colores = $7, disponible = $8, stock = $9,
               updated_at = NOW()
             WHERE proveedor_id = $1 AND codigo_proveedor = $2`,
            [proveedor.id, prod.codigo, prod.nombre, prod.descripcion,
             prod.categoria, prod.precio, prod.colores, prod.disponible, prod.stock]
          )
          actualizados++
        }
      } catch (err) {
        console.error(`Error procesando ${prod.codigo}:`, err)
        errores++
      }
    }

    page++
    hasMore = productos.length === 100
  }

  return { nuevos, actualizados, errores }
}
