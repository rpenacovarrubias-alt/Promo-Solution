import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { z } from 'zod'

const ItemSchema = z.object({
  producto_id:     z.number(),
  cantidad:        z.number().min(1),
  color:           z.string().optional(),
  tecnica:         z.string().optional(),
  notas:           z.string().optional(),
})

const QuoteSchema = z.object({
  cliente_nombre:  z.string().min(1),
  cliente_email:   z.string().email().optional(),
  cliente_empresa: z.string().optional(),
  canal:           z.enum(['web', 'telegram', 'whatsapp', 'manual']).default('web'),
  notas:           z.string().optional(),
  items:           z.array(ItemSchema).min(1),
})

async function generarFolio(): Promise<string> {
  const result = await queryOne<{ folio: string }>(
    `SELECT 'COT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('cotizaciones_id_seq')::text, 4, '0') AS folio`
  )
  return result?.folio ?? `COT-${Date.now()}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = QuoteSchema.parse(body)

    // Obtener precios actuales de los productos
    const ids = data.items.map(i => i.producto_id)
    const productos = await query<{
      id: number
      nombre: string
      precio_venta: number
      codigo_proveedor: string
    }>(
      `SELECT id, nombre, precio_venta, codigo_proveedor
       FROM productos
       WHERE id = ANY($1) AND disponible = TRUE`,
      [ids]
    )

    if (productos.length !== ids.length) {
      return NextResponse.json(
        { error: 'Uno o más productos no están disponibles' },
        { status: 400 }
      )
    }

    const precioMap = new Map(productos.map(p => [p.id, p]))

    // Calcular totales
    let subtotal = 0
    const itemsConPrecio = data.items.map(item => {
      const prod = precioMap.get(item.producto_id)!
      const precio_unitario = prod.precio_venta
      subtotal += precio_unitario * item.cantidad
      return { ...item, precio_unitario, nombre_producto: prod.nombre, codigo_proveedor: prod.codigo_proveedor }
    })

    const folio = await generarFolio()

    // Insertar cotización
    const cotizacion = await queryOne<{ id: number; folio: string }>(
      `INSERT INTO cotizaciones
         (folio, cliente_nombre, cliente_email, cliente_empresa, canal, subtotal, total, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$6,$7)
       RETURNING id, folio`,
      [folio, data.cliente_nombre, data.cliente_email ?? null,
       data.cliente_empresa ?? null, data.canal, subtotal, data.notas ?? null]
    )

    if (!cotizacion) throw new Error('Error creando cotización')

    // Insertar items
    for (const item of itemsConPrecio) {
      await query(
        `INSERT INTO cotizacion_items
           (cotizacion_id, producto_id, codigo_proveedor, nombre_producto, color, tecnica, cantidad, precio_unitario, notas)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [cotizacion.id, item.producto_id, item.codigo_proveedor,
         item.nombre_producto, item.color ?? null, item.tecnica ?? null,
         item.cantidad, item.precio_unitario, item.notas ?? null]
      )
    }

    return NextResponse.json({
      id:     cotizacion.id,
      folio:  cotizacion.folio,
      total:  subtotal,
      items:  itemsConPrecio.length,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', detalle: error.issues }, { status: 400 })
    }
    console.error('[API /quotes] Error:', error)
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 })
  }
}

// GET — listar cotizaciones (para el panel admin)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const folio = searchParams.get('folio')

  if (folio) {
    const cot = await queryOne(
      `SELECT c.*, json_agg(ci.*) AS items
       FROM cotizaciones c
       LEFT JOIN cotizacion_items ci ON ci.cotizacion_id = c.id
       WHERE c.folio = $1
       GROUP BY c.id`,
      [folio]
    )
    if (!cot) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json(cot)
  }

  const cotizaciones = await query(
    `SELECT id, folio, cliente_nombre, cliente_empresa, canal, total, estatus, created_at
     FROM cotizaciones
     ORDER BY created_at DESC
     LIMIT 50`
  )
  return NextResponse.json(cotizaciones)
}
