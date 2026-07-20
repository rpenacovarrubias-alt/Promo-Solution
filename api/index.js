// Función serverless única de Vercel — envuelve la app de Express completa
// (todas las rutas /api/* montadas en app.js). Ver vercel.json para el rewrite.
import app from '../app.js'

export default app
