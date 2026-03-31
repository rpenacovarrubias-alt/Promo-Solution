/**
 * Middleware de autenticación para la API pública de Promo Solution.
 * Valida el header X-API-Key contra la variable de entorno PUBLIC_API_KEY.
 *
 * Uso:
 *   const { ok, error } = validateApiKey(req)
 *   if (!ok) return res.status(401).json({ error })
 */

export function validateApiKey(req) {
  const key = req.headers['x-api-key']

  if (!key) {
    return { ok: false, error: 'Falta el header X-API-Key' }
  }

  const expected = process.env.PUBLIC_API_KEY
  if (!expected) {
    console.error('[auth] PUBLIC_API_KEY no está configurada en las variables de entorno')
    return { ok: false, error: 'API no configurada correctamente' }
  }

  if (key !== expected) {
    return { ok: false, error: 'API Key inválida' }
  }

  return { ok: true }
}

/**
 * Headers CORS permitiendo solo los orígenes que consumen la API pública
 * (n8n, bots, integraciones externas).
 */
export const PUBLIC_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
}
