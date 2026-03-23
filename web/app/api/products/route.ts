import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { Producto } from '@/lib/productos'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q         = searchParams.get('q') ?? ''
  const categoria = searchParams.get('categoria') ?? ''
  const proveedor = searchParams.get('proveedor') ?? ''
  const destacado = searchParams.get('destacado') === 'true'
  const limit     = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset    = parseInt(searchParams.get('offset') ?? '0')

  const conditions: string[] = ['p.visible_web = TRUE', 'p.disponible = TRUE']
  const params: unknown[] = []

  if (q) {
    params.push(q)
    conditions.push(`(
      p.nombre ILIKE '%' || $${params.length} || '%'
      OR p.codigo_proveedor ILIKE '%' || $${params.length} || '%'
      OR p.descripcion ILIKE '%' || $${params.length} || '%'
      OR p.tags::text ILIKE '%' || $${params.length} || '%'
    )`)
  }

  if (categoria) {
    params.push(categoria)
    conditions.push(`p.categoria_nombre ILIKE $${params.length}`)
  }

  if (proveedor) {
    params.push(proveedor)
    conditions.push(`pr.codigo = $${params.length}`)
  }

  if (destacado) {
    conditions.push(`p.destacado = TRUE`)
  }

  const where = conditions.join(' AND ')

  params.push(limit)
  params.push(offset)

  const sql = `
    SELECT
      p.id,
      p.codigo_proveedor,
      p.codigo_prm,
      p.nombre,
      p.descripcion,
      p.categoria_nombre,
      p.precio_venta,
      p.moneda,
      p.colores,
      p.tecnica_impresion,
      p.medidas,
      p.cantidad_minima,
      p.tiempo_entrega,
      p.imagen_principal,
      p.disponible,
      p.stock,
      p.destacado,
      p.tags,
      pr.nombre AS proveedor_nombre,
      pr.codigo AS proveedor_codigo
    FROM productos p
    JOIN proveedores pr ON pr.id = p.proveedor_id
    WHERE ${where}
    ORDER BY p.destacado DESC, p.nombre ASC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
  `

  try {
    const productos = await query<Producto>(sql, params)

    // Contar total para paginación
    const countSql = `
      SELECT COUNT(*) as total
      FROM productos p
      JOIN proveedores pr ON pr.id = p.proveedor_id
      WHERE ${where}
    `
    const countResult = await query<{ total: string }>(countSql, params.slice(0, -2))
    const total = parseInt(countResult[0]?.total ?? '0')

    return NextResponse.json({
      productos,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    console.error('[API /products] Error:', error)
    return NextResponse.json({ error: 'Error al consultar productos' }, { status: 500 })
  }
}
