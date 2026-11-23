import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from './prompt.js'
import { buscarProductos, handleObjection, listarTecnicas, GUEST_MARKUP_PERCENT } from './tools.js'
import { consultarConocimiento, TEMAS_CONOCIMIENTO } from './knowledge.js'
import { loadHistory, appendMessage } from './memory.js'
import { createQuote, QuoteValidationError } from '../quotes.js'

// Sonnet 5 en vez de Opus: es un bot de ventas de alto volumen (WhatsApp/Telegram),
// no una tarea de razonamiento pesado — casi la misma calidad que Opus en este tipo
// de flujo conversacional con tools, a una fracción del costo. Override con
// JULIO_MODEL si se necesita más capacidad para casos difíciles.
const MODEL = process.env.JULIO_MODEL || 'claude-sonnet-5'
const MAX_TOOL_ROUNDS = 4

const TOOLS = [
  {
    name: 'buscar_productos_catalogo',
    description: 'Busca productos en el catálogo real de Promo Solution. Llamar SIEMPRE antes de mencionar cualquier producto al cliente.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Nombre del producto a buscar, ej: gorras, termos, playeras' } },
      required: ['query'],
    },
  },
  {
    name: 'handle_objection',
    description: 'Maneja una objeción del cliente (precio, tiempo, calidad, competencia, confianza, duda, necesidad).',
    input_schema: {
      type: 'object',
      properties: { texto: { type: 'string', description: 'El mensaje del cliente donde objeta' } },
      required: ['texto'],
    },
  },
  {
    name: 'crear_cotizacion',
    description: 'Crea la cotización real en el sistema. Solo llamar cuando ya tengas los 4 datos del cliente y los productos elegidos.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        email: { type: 'string' },
        whatsapp: { type: 'string' },
        empresa: { type: 'string', description: 'Si es persona física, su propio nombre — nunca vacío' },
        productos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              cantidad: { type: 'number' },
              tecnicaId: { type: 'string', description: 'Opcional: tecnicaId de listar_tecnicas_impresion si el cliente quiere logo/impresión en ese producto' },
            },
            required: ['productId', 'cantidad'],
          },
        },
      },
      required: ['nombre', 'email', 'whatsapp', 'empresa', 'productos'],
    },
  },
  {
    name: 'listar_tecnicas_impresion',
    description: 'Lista las técnicas de impresión/personalización reales (serigrafía, bordado, etc.) con su costo por pieza. Llamar cuando el cliente quiera su logo en los productos, antes de crear_cotizacion.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'consultar_conocimiento',
    description: 'Consulta la base de conocimiento de Promo Solution (nunca inventes estos datos). Temas: objecion (manual de técnicas de venta), faq, caso_exito, competencia, pagos, empresa, proceso_compra, tecnica_impresion (explicación, materiales, tiempos), uniformes.',
    input_schema: {
      type: 'object',
      properties: {
        tema: { type: 'string', enum: TEMAS_CONOCIMIENTO },
        consulta: { type: 'string', description: 'Palabras clave de lo que el cliente pregunta, ej: "tiempo de entrega", "bordado vs serigrafía"' },
      },
      required: ['tema', 'consulta'],
    },
  },
]

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurado')
  return new Anthropic({ apiKey })
}

async function runTool(name, args, ctx) {
  switch (name) {
    case 'buscar_productos_catalogo': {
      const productos = await buscarProductos(args.query, ctx.markup)
      // Chat web sin sesión: mismo criterio que PriceGate del sitio — sin precio de lista.
      const visibles = ctx.showPrices ? productos : productos.map(p => ({ ...p, precio: null }))
      ctx.productsShown.push(...visibles)
      return visibles
    }
    case 'handle_objection':
      // Respuesta base (labeling/argumento/reframe) + las técnicas del manual de ventas que mejor calzan.
      return { ...handleObjection(args.texto), tecnicas_del_manual: await consultarConocimiento('objecion', args.texto) }
    case 'listar_tecnicas_impresion':
      return listarTecnicas()
    case 'consultar_conocimiento':
      return consultarConocimiento(args.tema, args.consulta)
    case 'crear_cotizacion': {
      try {
        const result = await createQuote({
          customer: { name: args.nombre, email: args.email, phone: args.whatsapp, company: args.empresa },
          channel: ctx.channel,
          items: args.productos.map(p => ({ productId: p.productId, quantity: p.cantidad, serviceId: p.tecnicaId })),
        })
        ctx.quoteCreated = result
        // Los precios de lista que mostró buscar_productos_catalogo usan el % de invitado (33%);
        // la cotización usa el % del cliente registrado, igual que el sitio público.
        const ajuste = result.items.some(i => i.markup !== GUEST_MARKUP_PERCENT)
        return {
          ok: true,
          folio: result.folio,
          subtotal: result.subtotal,
          iva: result.iva,
          total: result.total,
          items: result.items.map(i => ({
            producto: i.productName,
            cantidad: i.quantity,
            precioUnitario: i.unitPrice,
            tecnica: i.printTechnique,
            costoTecnicaPorPieza: i.printUnitCost,
            subtotal: i.subtotal,
          })),
          ...(ajuste && { aviso: 'El precio final usa el % del cliente registrado y difiere del precio de lista mostrado antes. Informa al cliente los precios de ESTA cotización.' }),
        }
      } catch (e) {
        if (e instanceof QuoteValidationError) return { ok: false, error: e.message }
        console.error('[julio crear_cotizacion]', e)
        return { ok: false, error: 'No se pudo crear la cotización, intenta de nuevo' }
      }
    }
    default:
      return { error: `Tool desconocida: ${name}` }
  }
}

// Procesa un mensaje de texto entrante y devuelve la respuesta de Julio,
// más cualquier producto mostrado (para enviar como foto) y la cotización
// creada en este turno, si hubo alguna.
// `cliente`: Client con sesión iniciada (solo el chat web lo conoce de antemano; en
// Telegram/Meta se identifica al cotizar). Con él, Julio usa su % y no le pide sus datos.
export async function handleTextMessage(sessionId, channel, userText, cliente = null) {
  const client = getClient()
  const history = await loadHistory(sessionId)
  await appendMessage(sessionId, channel, 'user', userText)

  const messages = [...history, { role: 'user', content: userText }]
  const showPrices = channel !== 'CHAT' || !!cliente
  const ctx = {
    productsShown: [],
    quoteCreated: null,
    channel,
    showPrices,
    markup: cliente ? parseFloat(cliente.markupPercent) : GUEST_MARKUP_PERCENT,
  }
  const system = buildSystemPrompt({ cliente, showPrices })

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      output_config: { effort: 'medium' },
      messages,
      tools: TOOLS,
    })

    if (response.stop_reason === 'refusal') {
      const text = 'Disculpa, no puedo ayudarte con eso. ¿Buscas algún producto promocional?'
      await appendMessage(sessionId, channel, 'assistant', text)
      return { text, products: ctx.productsShown, quote: ctx.quoteCreated }
    }

    const toolUses = response.content.filter(b => b.type === 'tool_use')

    if (!toolUses.length) {
      const text = response.content.find(b => b.type === 'text')?.text?.trim() || 'Disculpa, ¿me repites eso?'
      await appendMessage(sessionId, channel, 'assistant', text)
      return { text, products: ctx.productsShown, quote: ctx.quoteCreated }
    }

    messages.push({ role: 'assistant', content: response.content })

    const toolResults = []
    for (const call of toolUses) {
      const result = await runTool(call.name, call.input, ctx)
      toolResults.push({ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(result) })
    }
    messages.push({ role: 'user', content: toolResults })
  }

  const fallback = 'Dame un segundo para revisar bien tu pedido — ¿puedes repetirme qué buscas?'
  await appendMessage(sessionId, channel, 'assistant', fallback)
  return { text: fallback, products: ctx.productsShown, quote: ctx.quoteCreated }
}
