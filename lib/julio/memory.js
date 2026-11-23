import prisma from '../../routes/_db.js'

const CONTEXT_WINDOW = 12 // mismo tamaño de ventana que usaba mente_Julio en n8n

const ROLE_TO_JULIO = { user: 'USER', assistant: 'ASSISTANT', tool: 'TOOL' }
const ROLE_FROM_JULIO = { USER: 'user', ASSISTANT: 'assistant', TOOL: 'tool' }

export async function loadHistory(sessionId) {
  const rows = await prisma.julioMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: CONTEXT_WINDOW,
  })
  return rows.reverse().map(r => ({ role: ROLE_FROM_JULIO[r.role], content: r.content }))
}

export async function appendMessage(sessionId, channel, role, content) {
  // El enum Channel de la BD no tiene CHAT (chat web); mismo criterio que lib/quotes.js:
  // se guarda como EMAIL y la sesión se distingue por su prefijo `web:`.
  const dbChannel = channel === 'CHAT' ? 'EMAIL' : channel
  await prisma.julioMessage.create({
    data: { sessionId, channel: dbChannel, role: ROLE_TO_JULIO[role], content: content ?? '' },
  })
}
