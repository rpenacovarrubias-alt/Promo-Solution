import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Collection {
  id: string
  code: string
  name: string
  seoDescription?: string
  seoKeywords?: string
  isActive: boolean
  _count?: { products: number }
}

const schema = z.object({
  code: z.string().min(1, 'El código es requerido').max(20, 'Máximo 20 caracteres'),
  name: z.string().min(1, 'El nombre es requerido'),
  seoDescription: z.string().max(160, 'Máximo 160 caracteres').optional().or(z.literal('')),
  seoKeywords: z.string().optional().or(z.literal('')),
})

type CollectionForm = z.infer<typeof schema>

export default function Colecciones() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CollectionForm>({ resolver: zodResolver(schema) })

  const seoDescValue = watch('seoDescription') ?? ''

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

  useEffect(() => { fetchCollections() }, [])

  const openCreate = () => {
    setEditing(null)
    reset({ code: '', name: '', seoDescription: '', seoKeywords: '' })
    setDialogOpen(true)
  }

  const openEdit = (c: Collection) => {
    setEditing(c)
    reset({
      code: c.code,
      name: c.name,
      seoDescription: c.seoDescription ?? '',
      seoKeywords: c.seoKeywords ?? '',
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: CollectionForm) => {
    setIsSaving(true)
    try {
      const url = editing ? `/api/collections/${editing.id}` : '/api/collections'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Colección actualizada' : 'Colección creada')
      setDialogOpen(false)
      fetchCollections()
    } catch {
      toast.error('Error al guardar colección')
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

  const toggleActive = async (c: Collection) => {
    try {
      const res = await fetch(`/api/collections/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(c.isActive ? 'Colección desactivada' : 'Colección activada')
      fetchCollections()
    } catch {
      toast.error('Error al actualizar estatus')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Colecciones</h1>
          <p className="text-muted-foreground">Agrupa productos en colecciones para el sitio web</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva colección
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de colecciones</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Aún no hay colecciones. Crea la primera.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>SEO Descripción</TableHead>
                  <TableHead>SEO Keywords</TableHead>
                  <TableHead># Productos</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm font-semibold text-primary">
                      {c.code}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {c.seoDescription || '—'}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                      {c.seoKeywords || '—'}
                    </TableCell>
                    <TableCell>{c._count?.products ?? 0}</TableCell>
                    <TableCell>
                      <button onClick={() => toggleActive(c)}>
                        <Badge variant={c.isActive ? 'success' : 'secondary'}>
                          {c.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setDeletingId(c.id); setDeleteDialogOpen(true) }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar colección' : 'Nueva colección'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input placeholder="VERANO-2026" {...register('code')} />
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input placeholder="Colección Verano" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>SEO Descripción</Label>
                <span className={`text-xs ${seoDescValue.length > 140 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                  {seoDescValue.length}/160
                </span>
              </div>
              <Textarea
                placeholder="Descripción breve para buscadores (150–160 caracteres)"
                rows={2}
                {...register('seoDescription')}
              />
              {errors.seoDescription && (
                <p className="text-xs text-destructive">{errors.seoDescription.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>SEO Keywords</Label>
              <Input
                placeholder="promocionales, verano, playeras, gorras"
                {...register('seoKeywords')}
              />
              <p className="text-xs text-muted-foreground">Separadas por comas</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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
