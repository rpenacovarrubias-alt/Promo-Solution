// Webhook de Messenger (Facebook) e Instagram Messaging — mismo endpoint para
// ambos, Meta los distingue por `body.object` ('page' = Messenger, 'instagram'
// = Instagram DMs). Mismo patrón que routes/webhooks/telegram.js: delega el
// mensaje a lib/julio/agent.js (agnóstico de canal) y solo traduce el formato
// de entrada/salida propio de la plataforma.
import { Router } from 'express'
import { handleTextMessage } from '../../lib/julio/agent.js'
import { obtenerFichaProducto } from '../../lib/julio/tools.js'
import { sendMessage, sendProductCard, sendImage, verifyHandshake, verifySignature } from '../../lib/julio/meta.js'

const router = Router()
const MAX_PRODUCT_CARDS = 15

function fichaCompletaTexto(p) {
  const lineas = [
    p.nombre,
    `Código: ${p.codigo}`,
    p.descripcion,
    '',
    `💰 Precio: $${p.precio} MXN`,
    `📦 Cantidad mínima: ${p.cantidadMinima}`,
    `📊 Stock disponible: ${p.stock ?? 'Consultar con un asesor'}`,
  ]
  return lineas.filter(Boolean).join('\n')
}

// GET — handshake de verificación (una sola vez, al configurar el webhook en Meta)
router.get('/', (req, res) => {
  const challenge = verifyHandshake(req.query)
  if (challenge) return res.status(200).send(challenge)
  return res.sendStatus(403)
})

async function handleMessagingEvent(event, channel) {
  const senderId = event.sender?.id
  if (!senderId) return

  // Prefijo por canal: mismo senderId numérico podría repetirse entre FB e
  // IG (son namespaces separados de Meta), así que la sesión de Julio los
  // trata como conversaciones distintas.
  const sessionId = `${channel.toLowerCase()}:${senderId}`

  if (event.postback?.payload?.startsWith('ficha:')) {
    const productId = event.postback.payload.slice('ficha:'.length)
    const p = await obtenerFichaProducto(productId)
    if (p) {
      if (p.imagenUrl) await sendImage(senderId, p.imagenUrl)
      await sendMessage(senderId, fichaCompletaTexto(p))
    } else {
      await sendMessage(senderId, 'Ese producto ya no está disponible en catálogo.')
    }
    return
  }

  const text = event.message?.text
  if (!text) {
    // Adjuntos, "me gusta", etc. — nada que responder por ahora.
    if (event.message && !event.message.is_echo) {
      await sendMessage(senderId, 'Por ahora solo puedo leer texto — cuéntame qué producto buscas 🙂')
    }
    return
  }
  if (event.message.is_echo) return // eco de un mensaje que Julio mismo mandó

  const { text: reply, products } = await handleTextMessage(sessionId, channel, text)
  await sendMessage(senderId, reply)

  for (const p of products.slice(0, MAX_PRODUCT_CARDS)) {
    await sendProductCard(senderId, {
      title: p.nombre,
      subtitle: `💰 $${p.precio} MXN`,
      imageUrl: p.imagenUrl,
      productId: p.productId,
    })
  }
}

router.post('/', async (req, res) => {
  const signature = req.headers['x-hub-signature-256']
  if (process.env.META_APP_SECRET && !verifySignature(req.rawBody, signature)) {
    return res.sendStatus(401)
  }

  const body = req.body ?? {}
  if (body.object !== 'page' && body.object !== 'instagram') return res.sendStatus(404)

  const channel = body.object === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK'

  try {
    // Igual que Telegram: en serverless hay que esperar todo el trabajo antes
    // de responder, el runtime puede congelar la función justo después.
    for (const entry of body.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        await handleMessagingEvent(event, channel)
      }
    }
    res.sendStatus(200)
  } catch (e) {
    console.error('[webhooks/facebook]', e)
    res.sendStatus(200) // 200 igual, para que Meta no reintente el mismo evento por un bug nuestro
  }
})

export default router
