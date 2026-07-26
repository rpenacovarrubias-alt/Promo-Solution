import prisma from '../../routes/_db.js'

function calcFinalPrice(basePrice, utilityPercent) {
  return parseFloat((parseFloat(basePrice) * (1 + parseFloat(utilityPercent ?? 0) / 100)).toFixed(2))
}

// ─── buscar_productos_catalogo ─────────────────────────────────────────────────
// Mismo criterio de búsqueda que routes/public/products.js — catálogo real,
// nunca inventado. Devuelve como máximo 8 resultados (Julio no debe saturar
// una conversación de chat con una lista larga).

export async function buscarProductos(query) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      category: { select: { utilityPercent: true } },
      images: { where: { isPrimary: true }, take: 1 },
      variants: { orderBy: { minQty: 'asc' }, take: 1 },
    },
    orderBy: { name: 'asc' },
    take: 8,
  })

  return products.map(p => ({
    productId: p.id,
    codigo: p.externalId,
    nombre: p.name,
    descripcion: p.description ?? '',
    precio: calcFinalPrice(p.basePrice, p.category?.utilityPercent),
    imagenUrl: p.images[0]?.url ?? null,
    stock: p.stock ?? null,
    cantidadMinima: p.variants[0]?.minQty ?? 1,
  }))
}

// ─── handle_objection ───────────────────────────────────────────────────────────
// Port directo de la lógica de V13 (Vendedor_Automatico_JulioV13.json) — sin IA,
// detección de keywords contra un diccionario de respuestas con Labeling (Voss)
// + argumento de valor + prueba social + reframe.

const PATRONES = {
  precio:      ['caro', 'precio', 'cost', 'barato', 'económico', 'presupuesto'],
  tiempo:      ['tiempo', 'rápido', 'urgente', 'demora', 'cuanto tarda', 'cuando'],
  calidad:     ['calidad', 'bueno', 'resistente', 'durable', 'garantía'],
  competencia: ['otro', 'competencia', 'mejor', 'amazon', 'mercado libre', 'alibaba'],
  confianza:   ['confianza', 'segur', 'fraud', 'estafa', 'real', 'verdad'],
  duda:        ['no sé', 'dudo', 'tal vez', 'pensarlo', 'después'],
  necesidad:   ['necesito', 'no necesito', 'realmente', 'vale la pena'],
}

const RESPUESTAS = {
  precio: {
    respuesta: 'Parece que te preocupa la inversión...',
    argumento: 'Nuestros precios son competitivos porque somos fabricantes Y distribuidores. Sin intermediarios = mejor precio.',
    reframe: 'Más que un gasto, es una inversión en la imagen de tu marca.',
  },
  tiempo: {
    respuesta: 'Suena como que tienes urgencia...',
    argumento: 'Nuestros tiempos son competitivos porque hacemos todo internamente, sin depender de terceros.',
    reframe: 'Un día más de espera asegura que recibes exactamente lo que necesitas, bien hecho.',
  },
  calidad: {
    respuesta: 'Parece que has tenido malas experiencias antes...',
    argumento: 'Somos fabricantes. Controlamos el proceso de inicio a fin.',
    reframe: 'La calidad no es suerte, es proceso. Y nosotros controlamos el proceso completo.',
  },
  competencia: {
    respuesta: 'Entiendo que quieras comparar opciones...',
    argumento: 'Somos fabricantes + distribuidores. Diseño, producción y personalización en un solo lugar.',
    reframe: 'Puedes comprar más barato en otro lado, pero ¿a qué costo?',
  },
  confianza: {
    respuesta: 'Es normal tener dudas al comprar en línea...',
    argumento: 'Llevamos años en el mercado, con clientes recurrentes, pagos seguros y factura.',
    reframe: 'La mejor prueba de confianza son nuestros clientes que regresan.',
  },
  duda: {
    respuesta: 'Es natural querer pensarlo antes de decidir...',
    argumento: '¿Qué es específicamente lo que te detiene? ¿Precio, tiempo, o no estás seguro del producto?',
    reframe: 'Mientras lo piensas, tus competidores ya están poniendo su marca en manos de sus clientes.',
  },
  necesidad: {
    respuesta: 'Parece que no estás convencido de que lo necesitas...',
    argumento: 'La imagen de marca no es un lujo. Tus clientes juzgan tu profesionalismo por detalles.',
    reframe: 'No se trata de necesitar, se trata de destacar.',
  },
}

export function handleObjection(texto) {
  const t = (texto || '').toLowerCase()
  const detectadas = Object.keys(PATRONES).filter(tipo => PATRONES[tipo].some(p => t.includes(p)))

  if (detectadas.length === 0) {
    return { tipo: 'sin_objecion_detectada', respuesta: 'No detecto una objeción clara. Pregunta directamente qué le detiene.' }
  }

  const tipo = detectadas[0]
  const r = RESPUESTAS[tipo]
  return {
    tipo,
    multiple: detectadas.length > 1,
    respuesta: `${r.respuesta} ${r.argumento} ${r.reframe}`,
  }
}
