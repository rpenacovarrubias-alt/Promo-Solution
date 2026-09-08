import { Router } from 'express'
import { sendMail } from '../../lib/mail.js'

const router = Router()

const CONTACT_TO = 'hola@promosolution.com.mx'

router.post('/', async (req, res) => {
  const { name, email, phone, message } = req.body ?? {}
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'name, email y message son requeridos' })
  }

  const sent = await sendMail({
    to: CONTACT_TO,
    subject: `Nuevo mensaje de contacto — ${name.trim()}`,
    html: `
      <p><strong>Nombre:</strong> ${name.trim()}</p>
      <p><strong>Email:</strong> ${email.trim()}</p>
      ${phone?.trim() ? `<p><strong>Teléfono:</strong> ${phone.trim()}</p>` : ''}
      <p><strong>Mensaje:</strong></p>
      <p>${message.trim().replace(/\n/g, '<br>')}</p>
    `,
    account: 'hola',
  })
  if (!sent) return res.status(502).json({ error: 'No se pudo enviar el mensaje (revisa la configuración SMTP)' })

  return res.status(201).json({ ok: true })
})

export default router
