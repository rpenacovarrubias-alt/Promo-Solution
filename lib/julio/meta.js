// Cliente mínimo de la Send API de Meta (Messenger + Instagram Messaging) —
// HTTP plano, sin SDK. Ambos canales comparten el mismo endpoint (me/messages)
// y el mismo Page Access Token una vez que la cuenta de Instagram está
// vinculada a la Página de Facebook — no hace falta un cliente separado por
// canal, a diferencia de Telegram.
import crypto from 'crypto'

const GRAPH_VERSION = 'v20.0'
const GRAPH_BASE    = `https://graph.facebook.com/${GRAPH_VERSION}`

function pageAccessToken() {
  const token = process.env.META_PAGE_ACCESS_TOKEN
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN no configurado')
  return token
}

async function sendApi(body) {
  const res = await fetch(`${GRAPH_BASE}/me/messages?access_token=${pageAccessToken()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) console.error('[meta send]', res.status, await res.text())
}

export async function sendMessage(recipientId, text) {
  await sendApi({ recipient: { id: recipientId }, message: { text } })
}

// Tarjeta de producto — equivalente al "sendPhoto + inline keyboard" de
// Telegram, pero con el Generic Template de Messenger (imagen + título +
// subtítulo + botón). Sin imagen, cae a solo texto con el mismo botón.
export async function sendProductCard(recipientId, { title, subtitle, imageUrl, productId }) {
  if (!imageUrl) {
    await sendMessage(recipientId, `${title}\n${subtitle}`)
    return
  }
  await sendApi({
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title,
            subtitle,
            image_url: imageUrl,
            buttons: [{ type: 'postback', title: 'Ver ficha completa', payload: `ficha:${productId}` }],
          }],
        },
      },
    },
  })
}

export async function sendImage(recipientId, imageUrl) {
  await sendApi({ recipient: { id: recipientId }, message: { attachment: { type: 'image', payload: { url: imageUrl, is_reusable: true } } } })
}

// Verificación del webhook (handshake inicial de Meta: GET con hub.challenge)
export function verifyHandshake(query) {
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN
  if (!verifyToken) return null
  if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === verifyToken) {
    return query['hub.challenge']
  }
  return null
}

// Firma de cada evento (X-Hub-Signature-256) — confirma que el POST viene
// realmente de Meta y no de un tercero que adivinó la URL del webhook.
// Requiere el body crudo (ver app.js: express.json({ verify }) guarda
// req.rawBody antes de parsear).
export function verifySignature(rawBody, signatureHeader) {
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret || !signatureHeader || !rawBody) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
  } catch {
    return false // longitudes distintas -> timingSafeEqual truena, no coincide
  }
}
