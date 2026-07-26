import { Router } from 'express'
import { handleTextMessage } from '../../lib/julio/agent.js'
import { obtenerFichaProducto } from '../../lib/julio/tools.js'
import { sendMessage, sendPhoto, answerCallbackQuery } from '../../lib/julio/telegram.js'

const router = Router()
const MAX_PRODUCT_CARDS = 15

function fichaCard(p) {
  const caption = `${p.nombre}\n💰 $${p.precio} MXN`
  const replyMarkup = { inline_keyboard: [[{ text: '📋 Ver ficha completa', callback_data: `ficha:${p.productId}` }]] }
  return { caption, replyMarkup }
}

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

async function handleMessage(message, res) {
  const chatId = message?.chat?.id
  const text = message?.text
  if (!chatId) return res.sendStatus(200)

  if (!text) {
    await sendMessage(chatId, 'Por ahora solo puedo leer texto — cuéntame qué producto buscas 🙂')
    return res.sendStatus(200)
  }

  const sessionId = String(chatId)
  const { text: reply, products } = await handleTextMessage(sessionId, 'TELEGRAM', text)

  await sendMessage(chatId, reply)

  for (const p of products.slice(0, MAX_PRODUCT_CARDS)) {
    const { caption, replyMarkup } = fichaCard(p)
    if (p.imagenUrl) {
      await sendPhoto(chatId, p.imagenUrl, caption, replyMarkup)
    } else {
      await sendMessage(chatId, caption, replyMarkup)
    }
  }
  res.sendStatus(200)
}

async function handleCallbackQuery(callback, res) {
  const chatId = callback.message?.chat?.id ?? callback.from?.id
  const data = callback.data ?? ''

  if (chatId && data.startsWith('ficha:')) {
    const productId = data.slice('ficha:'.length)
    const p = await obtenerFichaProducto(productId)
    if (p) {
      const texto = fichaCompletaTexto(p)
      if (p.imagenUrl) await sendPhoto(chatId, p.imagenUrl, texto)
      else await sendMessage(chatId, texto)
    } else {
      await sendMessage(chatId, 'Ese producto ya no está disponible en catálogo.')
    }
  }

  await answerCallbackQuery(callback.id)
  res.sendStatus(200)
}

router.post('/', async (req, res) => {
  // Confirma que la petición viene de Telegram (secret_token configurado al hacer setWebhook)
  const secret = req.headers['x-telegram-bot-api-secret-token']
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.sendStatus(401)
  }

  // En serverless (Vercel) hay que esperar todo el trabajo antes de responder —
  // el runtime puede congelar la función justo después de responder, así que
  // "responder rápido y seguir trabajando en segundo plano" no es confiable aquí.
  try {
    if (req.body?.callback_query) {
      await handleCallbackQuery(req.body.callback_query, res)
    } else {
      await handleMessage(req.body?.message, res)
    }
  } catch (e) {
    console.error('[webhooks/telegram]', e)
    res.sendStatus(200) // 200 igual, para que Telegram no reintente el mismo update por un bug nuestro
  }
})

export default router
