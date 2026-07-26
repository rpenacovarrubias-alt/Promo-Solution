// Cliente mínimo de la Bot API de Telegram — HTTP plano, sin dependencia externa.
// Texto plano (sin parse_mode) a propósito: evita la complejidad de escapar
// MarkdownV2 que existía en el workflow de n8n (fuente de bugs ahí).

const API_BASE = 'https://api.telegram.org'

function botUrl(method) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no configurado')
  return `${API_BASE}/bot${token}/${method}`
}

export async function sendMessage(chatId, text) {
  const res = await fetch(botUrl('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  if (!res.ok) console.error('[telegram sendMessage]', res.status, await res.text())
}

export async function sendPhoto(chatId, photoUrl, caption) {
  const res = await fetch(botUrl('sendPhoto'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption }),
  })
  if (!res.ok) console.error('[telegram sendPhoto]', res.status, await res.text())
}
