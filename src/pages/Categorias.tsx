import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil, Loader2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

interface Category {
  id: string
  name: string
  seoDescription?: string
  seoKeywords?: string
  utilityPercent: string
  discountPercent: string
  _count?: { products: number }
}

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  seoDescription: z.string().max(160).optional().or(z.literal('')),
  seoKeywords: z.string().optional().or(z.literal('')),
  utilityPercent: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Debe ser ≥ 0'),
  discountPercent: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Debe ser ≥ 0'),
})

type CategoryForm = z.infer<typeof schema>

export default function Categorias() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryForm>({ resolver: zodResolver(schema) })

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error()
      setCategories(await res.json())
    } catch {
      toast.error('Error al cargar categorías')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const openEdit = (c: Category) => {
    setEditing(c)
    reset({
      name: c.name,
      seoDescription: c.seoDescription ?? '',
      seoKeywords: c.seoKeywords ?? '',
      utilityPercent: c.utilityPercent,
      discountPercent: c.discountPercent,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: CategoryForm) => {
    if (!editing) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/categories/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success('Categoría actualizada')
      setDialogOpen(false)
      fetchCategories()
    } catch {
      toast.error('Error al guardar categoría')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
        <p className="text-muted-foreground">
          Configura utilidad y descuento por categoría de producto
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorías del catálogo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Tag className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Las categorías aparecen automáticamente al sincronizar proveedores.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>SEO Descripción</TableHead>
                  <TableHead>SEO Keywords</TableHead>
                  <TableHead className="text-right"># Productos</TableHead>
                  <TableHead className="text-right">% Utilidad</TableHead>
                  <TableHead className="text-right">% Descuento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                      {c.seoDescription || '—'}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                      {c.seoKeywords || '—'}
                    </TableCell>
                    <TableCell className="text-right">{c._count?.products ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <span className={parseFloat(c.utilityPercent) > 0 ? 'font-semibold text-green-600' : 'text-muted-foreground'}>
                        {c.utilityPercent}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={parseFloat(c.discountPercent) > 0 ? 'font-semibold text-orange-600' : 'text-muted-foreground'}>
                        {c.discountPercent}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar categoría — {editing?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>SEO Descripción</Label>
              <Textarea rows={2} placeholder="Descripción para buscadores..." {...register('seoDescription')} />
            </div>
            <div className="space-y-2">
              <Label>SEO Keywords</Label>
              <Input placeholder="plumas, bolígrafos, escritura" {...register('seoKeywords')} />
              <p className="text-xs text-muted-foreground">Separadas por comas</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>% Utilidad</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="1000"
                    step="0.5"
                    {...register('utilityPercent')}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                {errors.utilityPercent && (
                  <p className="text-xs text-destructive">{errors.utilityPercent.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>% Descuento</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    {...register('discountPercent')}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                {errors.discountPercent && (
                  <p className="text-xs text-destructive">{errors.discountPercent.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
