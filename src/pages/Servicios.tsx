import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils'

type ServiceType = 'ESTAMPADO' | 'BORDADO' | 'GRABADO' | 'SUBLIMACION' | 'OTRO'

interface Service {
  id: string
  name: string
  type: ServiceType
  unitPrice: string
  description?: string
  isActive: boolean
}

const serviceTypeColors: Record<ServiceType, string> = {
  ESTAMPADO: 'bg-orange-100 text-orange-800',
  BORDADO: 'bg-purple-100 text-purple-800',
  GRABADO: 'bg-blue-100 text-blue-800',
  SUBLIMACION: 'bg-pink-100 text-pink-800',
  OTRO: 'bg-gray-100 text-gray-800',
}

const serviceTypeLabels: Record<ServiceType, string> = {
  ESTAMPADO: 'Estampado',
  BORDADO: 'Bordado',
  GRABADO: 'Grabado',
  SUBLIMACION: 'Sublimación',
  OTRO: 'Otro',
}

const serviceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['ESTAMPADO', 'BORDADO', 'GRABADO', 'SUBLIMACION', 'OTRO']),
  unitPrice: z.string().min(1, 'El precio es requerido'),
  description: z.string().optional(),
})

type ServiceForm = z.infer<typeof serviceSchema>

export default function Servicios() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedType, setSelectedType] = useState<ServiceType>('ESTAMPADO')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ServiceForm>({ resolver: zodResolver(serviceSchema) })

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services')
      if (!res.ok) throw new Error()
      setServices(await res.json())
    } catch {
      toast.error('Error al cargar servicios')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const openCreate = () => {
    setEditingService(null)
    setSelectedType('ESTAMPADO')
    reset({ name: '', type: 'ESTAMPADO', unitPrice: '', description: '' })
    setDialogOpen(true)
  }

  const openEdit = (s: Service) => {
    setEditingService(s)
    setSelectedType(s.type)
    reset({
      name: s.name,
      type: s.type,
      unitPrice: s.unitPrice,
      description: s.description ?? '',
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: ServiceForm) => {
    setIsSaving(true)
    try {
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services'
      const method = editingService ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success(editingService ? 'Servicio actualizado' : 'Servicio creado')
      setDialogOpen(false)
      fetchServices()
    } catch {
      toast.error('Error al guardar servicio')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/services/${deletingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Servicio eliminado')
      setDeleteDialogOpen(false)
      fetchServices()
    } catch {
      toast.error('Error al eliminar servicio')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Servicios</h1>
          <p className="text-muted-foreground">Servicios de personalización y acabados</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Servicio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de servicios</CardTitle>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precio unitario</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No hay servicios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${serviceTypeColors[s.type]}`}
                        >
                          {serviceTypeLabels[s.type]}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(parseFloat(s.unitPrice))}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {s.description ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.isActive ? 'success' : 'secondary'}>
                          {s.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingId(s.id)
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
            <DialogTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input placeholder="Ej: Serigrafía 1 tinta" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => {
                  setSelectedType(v as ServiceType)
                  setValue('type', v as ServiceType)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESTAMPADO">Estampado</SelectItem>
                  <SelectItem value="BORDADO">Bordado</SelectItem>
                  <SelectItem value="GRABADO">Grabado</SelectItem>
                  <SelectItem value="SUBLIMACION">Sublimación</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Precio unitario (MXN) *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" {...register('unitPrice')} />
              {errors.unitPrice && (
                <p className="text-xs text-destructive">{errors.unitPrice.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea placeholder="Descripción del servicio..." {...register('description')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingService ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar servicio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que deseas eliminar este servicio? No se puede deshacer.
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
