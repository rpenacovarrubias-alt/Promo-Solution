import nodemailer from 'nodemailer'

// Cuentas de correo del dominio disponibles como remitente. Todas viven en
// el mismo servidor Neubox (SMTP_HOST/SMTP_PORT compartidos), solo cambia
// el usuario/password de cada buzón.
const ACCOUNTS = {
  admin: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  ventas: { user: process.env.SMTP_USER_VENTAS, pass: process.env.SMTP_PASS_VENTAS },
  soporte: { user: process.env.SMTP_USER_SOPORTE, pass: process.env.SMTP_PASS_SOPORTE },
  hola: { user: process.env.SMTP_USER_HOLA, pass: process.env.SMTP_PASS_HOLA },
}

const transporters = {}

function getTransporter(account) {
  const creds = ACCOUNTS[account]
  if (!creds?.pass) return null
  if (!transporters[account]) {
    const port = Number(process.env.SMTP_PORT || 587)
    transporters[account] = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: creds.user, pass: creds.pass },
    })
  }
  return transporters[account]
}

// Envía un correo desde una de las cuentas del dominio (admin/ventas/soporte,
// default admin). No lanza si esa cuenta no está configurada — solo avisa por
// consola y regresa false, para que el flujo que lo llama (crear cliente,
// olvidé mi contraseña) nunca se caiga por un problema de correo.
export async function sendMail({ to, subject, html, account = 'admin', attachments }) {
  const t = getTransporter(account)
  if (!t) {
    console.warn(`[mail] cuenta "${account}" no configurada — no se envió "${subject}" a ${to}`)
    return false
  }
  try {
    await t.sendMail({ from: `"Promo Solution" <${ACCOUNTS[account].user}>`, to, subject, html, attachments })
    return true
  } catch (e) {
    console.error(`[mail] Error enviando "${subject}" a ${to}`, e)
    return false
  }
}
