import prisma from '../../routes/_db.js'

// Cerebro de Julio (V13 de n8n): las mismas tablas de conocimiento del esquema
// `public` de la BD — manual de objeciones/técnicas de venta, FAQs, casos de éxito,
// comparativa con la competencia, pagos, proceso de compra, técnicas de impresión y
// tipos de uniforme. Se leen en vivo (no se copian), así que lo que se edite ahí
// llega a Julio sin redeploy.
// ponytail: lectura directa de `public.*` con raw SQL; si esas tablas se mueven a
// promo_panel, solo cambia el prefijo de esquema de abajo.

const TEMAS = {
  objecion: 'manejo_objeciones',
  faq: 'faqs',
  caso_exito: 'casos_exito',
  competencia: 'comparacion_competencia',
  pagos: 'info_pagos',
  empresa: 'info_corporativa',
  proceso_compra: 'proceso_compra',
  tecnica_impresion: 'tecnicas_estampado',
  uniformes: 'tipos_uniformes',
}

export const TEMAS_CONOCIMIENTO = Object.keys(TEMAS)

const OCULTAR = ['id', 'created_at', 'updated_at', 'keywords', 'activo', 'frecuencia_uso', 'orden']

// Palabras de la consulta (≥4 letras) más su singular simple ("gorras" → "gorra"),
// para que el ILIKE encuentre plurales sin stemming.
function palabras(consulta) {
  const base = String(consulta ?? '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 4)
  return [...new Set(base.flatMap(w => (w.endsWith('s') && w.length > 4 ? [w, w.slice(0, -1)] : [w])))].slice(0, 10)
}

export async function consultarConocimiento(tema, consulta = '') {
  const tabla = TEMAS[tema]
  if (!tabla) return { error: `Tema desconocido. Usa uno de: ${TEMAS_CONOCIMIENTO.join(', ')}` }

  // `tabla` sale de la lista fija de arriba, nunca del usuario.
  const rows = await prisma.$queryRawUnsafe(
    `SELECT to_jsonb(t) AS r,
            (SELECT count(*) FROM unnest($1::text[]) w WHERE to_jsonb(t)::text ILIKE '%' || w || '%')::int AS score
       FROM public.${tabla} t
      WHERE t.activo = true
      ORDER BY score DESC, t.id
      LIMIT 3`,
    palabras(consulta),
  )

  return rows.map(({ r }) => Object.fromEntries(Object.entries(r).filter(([k]) => !OCULTAR.includes(k))))
}
