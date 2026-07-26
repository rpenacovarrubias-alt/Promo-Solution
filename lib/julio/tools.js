import prisma from '../../routes/_db.js'

function calcFinalPrice(basePrice, utilityPercent) {
  return parseFloat((parseFloat(basePrice) * (1 + parseFloat(utilityPercent ?? 0) / 100)).toFixed(2))
}

const PRODUCT_INCLUDE = {
  category: { select: { utilityPercent: true } },
  images: { where: { isPrimary: true }, take: 1 },
  variants: { orderBy: { minQty: 'asc' }, take: 1 },
}

function mapProduct(p) {
  return {
    productId: p.id,
    codigo: p.externalId,
    nombre: p.name,
    descripcion: p.description ?? '',
    precio: calcFinalPrice(p.basePrice, p.category?.utilityPercent),
    imagenUrl: p.images[0]?.url ?? null,
    stock: p.stock ?? null,
    cantidadMinima: p.variants[0]?.minQty ?? 1,
  }
}

// Ficha completa de un producto por id — para cuando el cliente toca el botón
// "Ver ficha completa" en la tarjeta que le mandamos por Telegram.
export async function obtenerFichaProducto(productId) {
  const p = await prisma.product.findUnique({ where: { id: productId }, include: PRODUCT_INCLUDE })
  if (!p || !p.isActive) return null
  return mapProduct(p)
}

// ─── buscar_productos_catalogo ─────────────────────────────────────────────────
// Catálogo real, nunca inventado. Aplica a CUALQUIER artículo (no hay lista de
// palabras hardcodeada):
//   1. Busca por nombre, descripción Y categoría — así "gorras" también
//      encuentra productos en la categoría "Gorras" aunque el nombre del
//      producto no traiga la palabra.
//   2. Prueba también el singular ("gorras" → "gorra") porque el usuario casi
//      siempre escribe en plural y el contains de Postgres no hace stemming.
//   3. Si lo anterior no encuentra nada, cae a similitud por trigramas
//      (pg_trgm) — cubre errores de escritura (ej. "gorraa", "termoo").
// Máximo 15 resultados (o todos los que haya, si son menos de 15).

export async function buscarProductos(query) {
  const terms = new Set([query])
  const singular = query.replace(/s$/i, '')
  if (singular.length >= 3 && singular !== query) terms.add(singular)

  const exactos = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [...terms].flatMap(term => [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { name: { contains: term, mode: 'insensitive' } } },
      ]),
    },
    include: PRODUCT_INCLUDE,
    orderBy: { name: 'asc' },
    take: 15,
  })

  if (exactos.length > 0) return exactos.map(mapProduct)

  // Fallback difuso — solo se ejecuta cuando la búsqueda exacta no trajo nada.
  // word_similarity (no similarity a secas) porque los nombres de producto son
  // frases largas ("Gorra Trucker Rainbow (TEST)") y una sola palabra del
  // usuario diluye demasiado el score de similarity() sobre la frase completa;
  // word_similarity busca la mejor coincidencia parcial dentro de la frase.
  const similares = await prisma.$queryRaw`
    SELECT p.id, GREATEST(
      word_similarity(${query}, p.name),
      word_similarity(${query}, coalesce(c.name, ''))
    ) AS sim
    FROM promo_panel."Product" p
    LEFT JOIN promo_panel."Category" c ON c.id = p."categoryId"
    WHERE p."isActive" = true
      AND (
        word_similarity(${query}, p.name) > 0.4
        OR word_similarity(${query}, coalesce(p.description, '')) > 0.35
        OR word_similarity(${query}, coalesce(c.name, '')) > 0.4
      )
    ORDER BY sim DESC
    LIMIT 15
  `
  if (similares.length === 0) return []

  const ids = similares.map(r => r.id)
  const productos = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: PRODUCT_INCLUDE,
  })
  productos.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
  return productos.map(mapProduct)
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
