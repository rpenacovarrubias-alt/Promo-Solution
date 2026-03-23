import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { formatDate, truncate } from '@/lib/utils'

interface Provider {
  id: string
  name: string
  apiUrl: string
  apiKey: string
  logo?: string
  isActive: boolean
  _count?: { products: number }
  createdAt: string
}

const providerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  apiUrl: z.string().url('URL inválida'),
  apiKey: z.string().min(1, 'El API key es requerido'),
  logo: z.string().url('URL inválida').optional().or(z.literal('')),
})

type ProviderForm = z.infer<typeof providerSchema>

export default function Proveedores() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProviderForm>({ resolver: zodResolver(providerSchema) })

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProviders(data)
    } catch {
      toast.error('Error al cargar proveedores')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  const openCreate = () => {
    setEditingProvider(null)
    reset({ name: '', apiUrl: '', apiKey: '', logo: '' })
    setDialogOpen(true)
  }

  const openEdit = (p: Provider) => {
    setEditingProvider(p)
    reset({ name: p.name, apiUrl: p.apiUrl, apiKey: p.apiKey, logo: p.logo ?? '' })
    setDialogOpen(true)
  }

  const openDelete = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const onSubmit = async (data: ProviderForm) => {
    setIsSaving(true)
    try {
      const url = editingProvider ? `/api/providers/${editingProvider.id}` : '/api/providers'
      const method = editingProvider ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success(editingProvider ? 'Proveedor actualizado' : 'Proveedor creado')
      setDialogOpen(false)
      fetchProviders()
    } catch {
      toast.error('Error al guardar proveedor')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/providers/${deletingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Proveedor eliminado')
      setDeleteDialogOpen(false)
      setDeletingId(null)
      fetchProviders()
    } catch {
      toast.error('Error al eliminar proveedor')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">Gestiona tus proveedores de catálogo</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>API URL</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead># Productos</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No hay proveedores registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  providers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {truncate(p.apiUrl, 40)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? 'success' : 'secondary'}>
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{p._count?.products ?? 0}</TableCell>
                      <TableCell>{formatDate(p.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDelete(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" placeholder="Mi Proveedor S.A." {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiUrl">API URL *</Label>
              <Input id="apiUrl" placeholder="https://api.proveedor.com" {...register('apiUrl')} />
              {errors.apiUrl && <p className="text-xs text-destructive">{errors.apiUrl.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input id="apiKey" type="password" placeholder="sk-..." {...register('apiKey')} />
              {errors.apiKey && <p className="text-xs text-destructive">{errors.apiKey.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL (opcional)</Label>
              <Input id="logo" placeholder="https://..." {...register('logo')} />
              {errors.logo && <p className="text-xs text-destructive">{errors.logo.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProvider ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar proveedor</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            ¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
