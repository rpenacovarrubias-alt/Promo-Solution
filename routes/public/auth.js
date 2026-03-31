// Middleware de autenticación para rutas públicas — valida X-API-Key
export function requireApiKey(req, res, next) {
  const key      = req.headers['x-api-key']
  const expected = process.env.PUBLIC_API_KEY

  if (!expected) {
    console.error('[public/auth] PUBLIC_API_KEY no configurada')
    return res.status(500).json({ error: 'API no configurada correctamente' })
  }
  if (!key)            return res.status(401).json({ error: 'Falta el header X-API-Key' })
  if (key !== expected) return res.status(401).json({ error: 'API Key inválida' })

  next()
}
