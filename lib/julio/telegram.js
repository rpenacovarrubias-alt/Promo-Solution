// Cliente mínimo de la Bot API de Telegram — HTTP plano, sin dependencia externa.
// Texto plano (sin parse_mode) a propósito: evita la complejidad de escapar
// MarkdownV2 que existía en el workflow de n8n (fuente de bugs ahí).

const API_BASE = 'https://api.telegram.org'

function botUrl(method) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no configurado')
  return `${API_BASE}/bot${token}/${method}`
}

async function post(method, body) {
  const res = await fetch(botUrl(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) console.error(`[telegram ${method}]`, res.status, await res.text())
}

export async function sendMessage(chatId, text, replyMarkup) {
  await post('sendMessage', { chat_id: chatId, text, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) })
}

export async function sendPhoto(chatId, photoUrl, caption, replyMarkup) {
  await post('sendPhoto', { chat_id: chatId, photo: photoUrl, caption, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) })
}

// Quita el "cargando" del botón en el cliente de Telegram. Debe llamarse
// siempre que llega un callback_query, tenga o no texto que mostrar.
export async function answerCallbackQuery(callbackQueryId, text) {
  await post('answerCallbackQuery', { callback_query_id: callbackQueryId, ...(text ? { text } : {}) })
}
