import prisma from '../_db.js'

// Resuelve el Client dueño del Bearer token de sesión (o null si no hay
// sesión / expiró). Compartido entre customerAuth.js (login/me) y cualquier
// otra ruta pública que necesite saber quién está viendo (ej. products.js
// para aplicar el % de descuento personalizado del cliente).
export async function getSessionClient(req, select = { id: true }) {
  const auth = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null

  const session = await prisma.clientSession.findUnique({ where: { token } })
  if (!session || session.expiresAt < new Date()) return null

  return prisma.client.findUnique({ where: { id: session.clientId }, select })
}
