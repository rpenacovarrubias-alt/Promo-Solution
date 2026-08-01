import { Router } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import prisma from '../_db.js'

const router = Router()

const SESSION_DAYS = 30
const RESET_MINUTES = 60

const SAFE_CLIENT_SELECT = {
  id: true, name: true, email: true, phone: true, company: true, createdAt: true,
}

function newToken() {
  return crypto.randomBytes(32).toString('hex')
}

async function createSession(clientId) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const session = await prisma.clientSession.create({ data: { clientId, token: newToken(), expiresAt } })
  return { token: session.token, expiresAt: session.expiresAt }
}

async function getSessionClient(req) {
  const auth = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null

  const session = await prisma.clientSession.findUnique({ where: { token } })
  if (!session || session.expiresAt < new Date()) return null

  return prisma.client.findUnique({ where: { id: session.clientId }, select: SAFE_CLIENT_SELECT })
}

// ── Registro ────────────────────────────────────────────────────────────────
// Reconcilia por teléfono/email con el Client que ya pudiera existir de una
// cotización de invitado (misma lógica que lib/quotes.js) — no duplica.
router.post('/register', async (req, res) => {
  const { name, email, phone, password, company } = req.body ?? {}
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email y password son requeridos' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
  }

  try {
    let client = phone ? await prisma.client.findFirst({ where: { phone } }) : null
    if (!client) client = await prisma.client.findUnique({ where: { email } })

    if (client?.password) {
      return res.status(409).json({ error: 'Ya existe una cuenta con estos datos. Inicia sesión.' })
    }

    const hashed = await bcrypt.hash(password, 10)

    if (client) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: { password: hashed, name: name.trim(), phone: phone ?? client.phone, company: company?.trim() ?? client.company },
        select: SAFE_CLIENT_SELECT,
      })
    } else {
      client = await prisma.client.create({
        data: { name: name.trim(), email, phone: phone ?? null, company: company?.trim() ?? null, password: hashed },
        select: SAFE_CLIENT_SELECT,
      })
    }

    const session = await createSession(client.id)
    return res.status(201).json({ client, ...session })
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'El email ya está registrado' })
    console.error('[public/auth register]', e)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ── Login ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) return res.status(400).json({ error: 'email y password son requeridos' })

  try {
    const client = await prisma.client.findUnique({ where: { email } })
    if (!client?.password || !(await bcrypt.compare(password, client.password))) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    }

    const session = await createSession(client.id)
    const safeClient = Object.fromEntries(Object.keys(SAFE_CLIENT_SELECT).map(k => [k, client[k]]))
    return res.json({ client: safeClient, ...session })
  } catch (e) {
    console.error('[public/auth login]', e)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ── Logout ──────────────────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  const auth = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (token) await prisma.clientSession.deleteMany({ where: { token } }).catch(() => {})
  return res.status(204).end()
})

// ── Sesión actual ───────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  const client = await getSessionClient(req)
  if (!client) return res.status(401).json({ error: 'No autenticado' })
  return res.json({ client })
})

// ── Olvidé mi contraseña ────────────────────────────────────────────────────
// TODO: falta conectar el envío real del correo (SMTP_* en .env aún sin usar en
// ningún lado del código). Por ahora el link se imprime en el log del servidor
// para poder probar el flujo de punta a punta.
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body ?? {}
  if (!email) return res.status(400).json({ error: 'email es requerido' })

  const client = await prisma.client.findUnique({ where: { email } })
  if (client?.password) {
    const resetToken = newToken()
    const resetTokenExpiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000)
    await prisma.client.update({ where: { id: client.id }, data: { resetToken, resetTokenExpiresAt } })
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promosolution.com.mx'}/restablecer-contrasena?token=${resetToken}`
    console.log(`[public/auth forgot-password] TODO enviar por email a ${email}: ${resetUrl}`)
  }

  // Respuesta genérica siempre — no revela si el correo existe o no.
  return res.json({ message: 'Si el correo existe, se enviará un enlace para restablecer la contraseña.' })
})

// ── Restablecer contraseña ──────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body ?? {}
  if (!token || !password) return res.status(400).json({ error: 'token y password son requeridos' })
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })

  const client = await prisma.client.findUnique({ where: { resetToken: token } })
  if (!client || !client.resetTokenExpiresAt || client.resetTokenExpiresAt < new Date()) {
    return res.status(400).json({ error: 'El enlace es inválido o ya expiró' })
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.client.update({
    where: { id: client.id },
    data: { password: hashed, resetToken: null, resetTokenExpiresAt: null },
  })
  await prisma.clientSession.deleteMany({ where: { clientId: client.id } })

  return res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' })
})

export default router
