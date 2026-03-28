import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id } = req.query

  try {
    // ── Single item ────────────────────────────────────────────────
    if (id) {
      if (req.method === 'PUT') {
        const { name, email, password, role, isActive } = req.body
        const data = {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
          ...(role !== undefined && { role }),
          ...(isActive !== undefined && { isActive }),
        }
        if (password) data.password = await bcrypt.hash(password, 10)
        const user = await prisma.user.update({
          where: { id },
          data,
          select: { id: true, name: true, email: true, role: true, isActive: true },
        })
        return res.status(200).json(user)
      }

      return res.status(405).json({ error: 'Method not allowed' })
    }

    // ── Collection ─────────────────────────────────────────────────
    if (req.method === 'GET') {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, isActive: true },
        orderBy: { name: 'asc' },
      })
      return res.status(200).json(users)
    }

    if (req.method === 'POST') {
      const { name, email, password, role } = req.body
      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'name, email, password and role are required' })
      }
      const hashed = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: { name, email, password: hashed, role, isActive: true },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      })
      return res.status(201).json(user)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/users]', error)
    if (error.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    if (error.code === 'P2002') return res.status(409).json({ error: 'El email ya está registrado' })
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
