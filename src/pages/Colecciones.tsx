import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Collection {
  id: string
  code: string
  name: string
  seoDescription?: string
  seoKeywords?: string
  isActive: boolean
  _count?: { products: number }
}

// Pares de tono (tile-a, tile-b) — mismo lenguaje visual que colecciones.html.
const TILE_PAIRS: [string, string][] = [
  ['#B02A2A', '#7A1E1E'],
  ['#2C4A8C', '#17264A'],
  ['#1E8E5A', '#155C3A'],
  ['#C9A15A', '#A8823F'],
  ['#5C6577', '#3A4150'],
]
function tileFor(index: number) {
  return TILE_PAIRS[index % TILE_PAIRS.length]
}

function slugify(name: string) {
  return name
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function Colecciones() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [name, setName] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [isActive, setIsActive] = useState(true)

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections')
      if (!res.ok) throw new Error()
      setCollections(await res.json())
    } catch {
      toast.error('Error al cargar colecciones')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setSeoDesc('')
    setSeoKeywords('')
    setIsActive(true)
    setDialogOpen(true)
  }

  const openEdit = (c: Collection) => {
    setEditing(c)
    setName(c.name)
    setSeoDesc(c.seoDescription ?? '')
    setSeoKeywords(c.seoKeywords ?? '')
    setIsActive(c.isActive)
    setDialogOpen(true)
  }

  const onSubmit = async () => {
    if (!name.trim()) return
    setIsSaving(true)
    try {
      const url = editing ? `/api/collections/${editing.id}` : '/api/collections'
      const method = editing ? 'PUT' : 'POST'
      const body = editing
        ? { name: name.trim(), seoDescription: seoDesc, seoKeywords, isActive }
        : { code: slugify(name), name: name.trim(), seoDescription: seoDesc, seoKeywords }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error)
      }
      toast.success(editing ? 'Colección actualizada' : 'Colección creada')
      setDialogOpen(false)
      fetchCollections()
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : 'Error al guardar colección')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/collections/${deletingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Colección eliminada')
      setDeleteDialogOpen(false)
      setDeletingId(null)
      fetchCollections()
    } catch {
      toast.error('Error al eliminar colección')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Colecciones</h1>
          <p className="text-muted-foreground">Agrupa productos en colecciones para mostrarlas en tu sitio web</p>
        </div>
        <div className="h-48 animate-pulse rounded-xl border bg-muted/30" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Colecciones</h1>
          <p className="text-muted-foreground">Agrupa productos en colecciones para mostrarlas en tu sitio web</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva colección
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => {
          const [a, b] = tileFor(i)
          return (
            <div key={c.id} className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg">
              <div
                className="relative flex h-28 items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${a} 0 50%, ${b} 50% 100%)` }}
              >
                <ImageIcon className="h-8 w-8" style={{ color: 'rgba(255,255,255,0.55)' }} />
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-700 hover:bg-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { setDeletingId(c.id); setDeleteDialogOpen(true) }}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-destructive hover:bg-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-1 flex items-start justify-between">
                  <span className="text-sm font-semibold">{c.name}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={c.isActive ? { background: '#EAF7EF', color: '#1E8E5A' } : { background: '#F1F5F9', color: '#94A3B8' }}
                  >
                    {c.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{c._count?.products ?? 0} productos</div>
              </div>
            </div>
          )
        })}

        <button
          onClick={openCreate}
          className="flex min-h-[176px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors hover:border-gold hover:bg-gold/5"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gold/15">
            <Plus className="h-5 w-5 text-gold" />
          </div>
          <div className="text-sm font-semibold text-foreground">Nueva colección</div>
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar colección' : 'Nueva colección'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input placeholder="Ej. Regreso a clases" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Imagen banner</Label>
              <div className="rounded-lg border-2 border-dashed p-5 text-center text-muted-foreground">
                <ImageIcon className="mx-auto mb-2 h-5 w-5 opacity-40" />
                <p className="text-xs">1400×386px recomendado — próximamente</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>SEO — Descripción</Label>
              <Textarea rows={2} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>SEO — Palabras clave</Label>
              <Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <span className="text-sm font-medium">Activa (visible en el sitio)</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={isSaving}>
              {editing ? 'Actualizar' : 'Crear colección'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar colección</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que deseas eliminar esta colección? Los productos asociados no se eliminarán.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
