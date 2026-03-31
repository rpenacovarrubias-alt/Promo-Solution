// Instancia única de PrismaClient para todo el servidor Express.
// No crear una instancia por request (patrón Vercel) ya que en un servidor
// persistente eso agota el pool de conexiones de PostgreSQL.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

export default prisma
