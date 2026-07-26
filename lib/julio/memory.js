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
  await prisma.julioMessage.create({
    data: { sessionId, channel, role: ROLE_TO_JULIO[role], content: content ?? '' },
  })
}
