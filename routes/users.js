import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from './_db.js'

const router = Router()

const SAFE_SELECT = { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }

router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: SAFE_SELECT, orderBy: { name: 'asc' } })
    return res.json(users)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' })
  }
  try {
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, isActive: true },
      select: SAFE_SELECT,
    })
    return res.status(201).json(user)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'El email ya está registrado' })
    console.error('[users POST]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  const { name, email, password, role, isActive } = req.body
  const data = {
    ...(name !== undefined && { name }),
    ...(email !== undefined && { email }),
    ...(role !== undefined && { role }),
    ...(isActive !== undefined && { isActive }),
  }
  if (password) data.password = await bcrypt.hash(password, 10)
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data, select: SAFE_SELECT })
    return res.json(user)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } })
    return res.status(204).end()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
