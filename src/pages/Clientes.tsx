import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, FileSpreadsheet } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ClientStatus = 'ACTIVO' | 'INACTIVO' | 'POR_CONFIRMAR'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  markupPercent: string
  status: ClientStatus
  _count?: { quotes: number }
}

const STATUS_TABS: { key: ClientStatus; label: string }[] = [
  { key: 'ACTIVO', label: 'Activos' },
  { key: 'INACTIVO', label: 'Inactivos' },
  { key: 'POR_CONFIRMAR', label: 'Por confirmar' },
]

const STATUS_BADGE: Record<ClientStatus, { label: string; variant: 'success' | 'secondary' | 'warning' }> = {
  ACTIVO: { label: 'Activo', variant: 'success' },
  INACTIVO: { label: 'Inactivo', variant: 'secondary' },
  POR_CONFIRMAR: { label: 'Por confirmar', variant: 'warning' },
}

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  markupPercent: z.string().min(1, 'El % de utilidad es requerido'),
})

type ClientForm = z.infer<typeof clientSchema>

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<ClientStatus>('ACTIVO')
  const [editStatus, setEditStatus] = useState<ClientStatus>('ACTIVO')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientForm>({ resolver: zodResolver(clientSchema) })

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      if (!res.ok) throw new Error()
      setClients(await res.json())
    } catch {
      toast.error('Error al cargar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const visibleClients = useMemo(
    () =>
      clients
        .map((c, i) => ({ c, folio: `CLTE-${String(i + 1).padStart(5, '0')}` }))
        .filter(({ c }) => c.status === activeTab),
    [clients, activeTab],
  )

  const openCreate = () => {
    setEditingClient(null)
    setEditStatus('ACTIVO')
    reset({ name: '', email: '', phone: '', company: '', markupPercent: '33' })
    setDialogOpen(true)
  }

  const openEdit = (c: Client) => {
    setEditingClient(c)
    setEditStatus(c.status)
    reset({
      name: c.name,
      email: c.email,
      phone: c.phone ?? '',
      company: c.company ?? '',
      markupPercent: c.markupPercent,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: ClientForm) => {
    setIsSaving(true)
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'
      const payload = editingClient ? { ...data, status: editStatus } : data
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(editingClient ? 'Cliente actualizado' : 'Cliente creado')
      setDialogOpen(false)
      fetchClients()
    } catch {
      toast.error('Error al guardar cliente')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/clients/${deletingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Cliente eliminado')
      setDeleteDialogOpen(false)
      fetchClients()
    } catch {
      toast.error('Error al eliminar cliente')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tu cartera de clientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/api/clients/excel" download>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Descargar clientes
            </a>
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de clientes</CardTitle>
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
                  <TableHead>Folio</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>% de Desc.</TableHead>
                  <TableHead># Cotizaciones</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      No hay clientes en esta categoría
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleClients.map(({ c, folio }) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{folio}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.company ?? '—'}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone ?? '—'}</TableCell>
                      <TableCell className="font-medium">{c.markupPercent}%</TableCell>
                      <TableCell>{c._count?.quotes ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[c.status].variant}>{STATUS_BADGE[c.status].label}</Badge>
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
                            onClick={() => {
                              setDeletingId(c.id)
                              setDeleteDialogOpen(true)
                            }}
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
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input placeholder="Juan García" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input placeholder="Mi Empresa S.A." {...register('company')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" placeholder="juan@empresa.mx" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input placeholder="+52 55 1234 5678" {...register('phone')} />
              </div>
              <div className="space-y-2">
                <Label>% de Desc.</Label>
                <Input type="number" min="0" max="100" step="0.01" {...register('markupPercent')} />
                {errors.markupPercent && (
                  <p className="text-xs text-destructive">{errors.markupPercent.message}</p>
                )}
              </div>
            </div>
            {editingClient && (
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ClientStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_TABS.map((s) => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingClient ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que deseas eliminar este cliente? No se puede deshacer.
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
