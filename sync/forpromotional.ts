/**
 * Sincronizador — 4 For Promotional
 * ID de cuenta: 22100
 * Usuario: juanjocovas@gmail.com
 */

import { query, queryOne } from '../web/lib/db'

const API_BASE   = 'https://www.forpromotional.com.mx/api'
const API_USER   = process.env.FORPROMOTIONAL_USER!
const API_PASS   = process.env.FORPROMOTIONAL_PASS!
const ACCOUNT_ID = process.env.FORPROMOTIONAL_ID ?? '22100'

let _token: string | null = null

async function getToken(): Promise<string> {
  if (_token) return _token
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: API_USER, contrasena: API_PASS, id_cuenta: ACCOUNT_ID }),
  })
  if (!res.ok) throw new Error(`ForPromotional auth error: ${res.status}`)
  const data = await res.json()
  _token = data.token ?? data.access_token
  return _token!
}

async function fetchProductos(token: string, page = 1) {
  const res = await fetch(`${API_BASE}/productos?pagina=${page}&limite=100`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`ForPromotional productos error: ${res.status}`)
  return res.json()
}

export async function syncForPromotional() {
  const proveedor = await queryOne<{ id: number }>(
    `SELECT id FROM proveedores WHERE codigo = 'forpromotional'`
  )
  if (!proveedor) throw new Error('Proveedor forpromotional no encontrado en BD')

  let nuevos = 0, actualizados = 0, errores = 0
  const token = await getToken()
  let page = 1, hasMore = true

  while (hasMore) {
    const data = await fetchProductos(token, page)
    const productos = data.productos ?? data.data ?? []
    if (!productos.length) { hasMore = false; break }

    for (const prod of productos) {
      try {
        const exists = await queryOne<{ id: number }>(
          `SELECT id FROM productos WHERE proveedor_id = $1 AND codigo_proveedor = $2`,
          [proveedor.id, prod.codigo]
        )

        const vals = [
          proveedor.id, prod.codigo, prod.nombre, prod.descripcion ?? '',
          prod.categoria ?? '', prod.precio_costo ?? prod.precio,
          (prod.precio_costo ?? prod.precio) * 1.40,
          prod.colores ?? [], prod.disponible ?? true, prod.stock ?? null,
          prod.medidas ?? null, prod.peso ?? null, prod.tecnica_impresion ?? [],
          prod.cantidad_minima ?? 1,
        ]

        if (!exists) {
          await query(
            `INSERT INTO productos
               (proveedor_id, codigo_proveedor, nombre, descripcion, categoria_nombre,
                precio_costo, precio_venta, colores, disponible, stock,
                medidas, peso, tecnica_impresion, cantidad_minima)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            vals
          )
          nuevos++
        } else {
          await query(
            `UPDATE productos SET
               nombre=$3, descripcion=$4, categoria_nombre=$5,
               precio_costo=$6, colores=$8, disponible=$9,
               stock=$10, medidas=$11, peso=$12, tecnica_impresion=$13,
               cantidad_minima=$14, updated_at=NOW()
             WHERE proveedor_id=$1 AND codigo_proveedor=$2`,
            vals
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
