import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import type { ProductoDetalle } from '@/lib/productos'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  // El slug puede ser el ID numérico o el código del proveedor
  const isNumeric = /^\d+$/.test(slug)

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
      p.peso,
      p.materiales,
      p.area_impresion,
      p.cantidad_minima,
      p.tiempo_entrega,
      p.imagen_principal,
      p.imagenes,
      p.ficha_tecnica_url,
      p.disponible,
      p.stock,
      p.destacado,
      p.tags,
      p.metadata,
      pr.nombre AS proveedor_nombre,
      pr.codigo AS proveedor_codigo
    FROM productos p
    JOIN proveedores pr ON pr.id = p.proveedor_id
    WHERE ${isNumeric ? 'p.id = $1' : 'p.codigo_proveedor ILIKE $1'}
      AND p.visible_web = TRUE
    LIMIT 1
  `

  try {
    const producto = await queryOne<ProductoDetalle>(sql, [
      isNumeric ? parseInt(slug) : slug,
    ])

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Productos relacionados (misma categoría)
    const relacionados = await query<{ id: number; nombre: string; precio_venta: number; imagen_principal: string | null; codigo_proveedor: string }>(
      `SELECT id, nombre, precio_venta, imagen_principal, codigo_proveedor
       FROM productos
       WHERE categoria_nombre = $1
         AND id != $2
         AND visible_web = TRUE
         AND disponible = TRUE
       ORDER BY destacado DESC, RANDOM()
       LIMIT 6`,
      [producto.categoria_nombre, producto.id]
    )

    return NextResponse.json({ producto, relacionados })
  } catch (error) {
    console.error('[API /products/[slug]] Error:', error)
    return NextResponse.json({ error: 'Error al consultar producto' }, { status: 500 })
  }
}
