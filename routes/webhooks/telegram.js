import { Router } from 'express'
import { handleTextMessage } from '../../lib/julio/agent.js'
import { sendMessage, sendPhoto } from '../../lib/julio/telegram.js'

const router = Router()
const MAX_PHOTOS = 5

router.post('/', async (req, res) => {
  // Confirma que la petición viene de Telegram (secret_token configurado al hacer setWebhook)
  const secret = req.headers['x-telegram-bot-api-secret-token']
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.sendStatus(401)
  }

  // Siempre responde 200 rápido — evita que Telegram reintente el mismo update
  // si algo tarda o falla río abajo.
  res.sendStatus(200)

  try {
    const message = req.body?.message
    const chatId  = message?.chat?.id
    const text    = message?.text
    if (!chatId) return

    if (!text) {
      await sendMessage(chatId, 'Por ahora solo puedo leer texto — cuéntame qué producto buscas 🙂')
      return
    }

    const sessionId = String(chatId)
    const { text: reply, products } = await handleTextMessage(sessionId, 'TELEGRAM', text)

    await sendMessage(chatId, reply)

    for (const p of products.slice(0, MAX_PHOTOS)) {
      if (p.imagenUrl) {
        await sendPhoto(chatId, p.imagenUrl, `${p.nombre}\n$${p.precio} MXN`)
      }
    }
  } catch (e) {
    console.error('[webhooks/telegram]', e)
  }
})

export default router
