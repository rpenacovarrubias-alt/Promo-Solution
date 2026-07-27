import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Pencil, Search, Info, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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

interface Category {
  id: string
  name: string
  seoDescription?: string
  seoKeywords?: string
  utilityPercent: string
  discountPercent: string
  _count?: { products: number }
}

const PALETTE = ['#17264A', '#C9A15A', '#5C6577', '#B02A2A', '#1E8E5A', '#2C4A8C']
function colorFor(name: string) {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PALETTE[hash % PALETTE.length]
}

export default function Categorias() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState('10')
  const [page, setPage] = useState(1)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [seoDialogOpen, setSeoDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [seoDesc, setSeoDesc] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

  useEffect(() => {
    fetchCategories()
  }, [])

  const filtered = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search],
  )

  const limit = parseInt(pageSize)
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const pageItems = filtered.slice((page - 1) * limit, page * limit)

  const updatePercent = async (cat: Category, field: 'utilityPercent' | 'discountPercent', value: string) => {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, [field]: String(num) } : c)))
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: num }),
      })
      if (!res.ok) throw new Error()
      setSavedId(cat.id + field)
      setTimeout(() => setSavedId(null), 1400)
    } catch {
      toast.error('Error al guardar')
    }
  }

  const openSeoModal = (c: Category) => {
    setEditing(c)
    setSeoDesc(c.seoDescription ?? '')
    setSeoKeywords(c.seoKeywords ?? '')
    setSeoDialogOpen(true)
  }

  const saveSeo = async () => {
    if (!editing) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/categories/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seoDescription: seoDesc, seoKeywords }),
      })
      if (!res.ok) throw new Error()
      toast.success('SEO actualizado')
      setSeoDialogOpen(false)
      fetchCategories()
    } catch {
      toast.error('Error al guardar SEO')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">Configura utilidad y descuento por categoría de producto</p>
        </div>
        <div className="h-64 animate-pulse rounded-xl border bg-muted/30" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
        <p className="text-muted-foreground">Configura utilidad y descuento por categoría de producto</p>
      </div>

      <div className="flex gap-3 rounded-lg p-4" style={{ background: '#FDF6E8' }}>
        <Info className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: '#A8823F' }} />
        <p className="text-sm" style={{ color: '#A8823F' }}>
          Las categorías aparecen automáticamente al sincronizar tus proveedores. Aquí solo configuras SEO, utilidad y
          descuento para cada una.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
          Aún no hay categorías. Aparecerán al sincronizar un proveedor en{' '}
          <a href="/catalogos" className="text-navy underline">
            Catálogos
          </a>
          .
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Buscar categoría..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Mostrar
              <Select value={pageSize} onValueChange={(v) => { setPageSize(v); setPage(1) }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              registros
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Categoría</th>
                  <th className="px-5 py-3 font-medium">SEO</th>
                  <th className="px-5 py-3 text-right font-medium"># Productos</th>
                  <th className="px-5 py-3 text-right font-medium">Utilidad %</th>
                  <th className="px-5 py-3 text-right font-medium">Descuento %</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                          style={{ background: colorFor(c.name) }}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[220px] truncate px-5 py-3.5 text-muted-foreground">
                      {c.seoDescription || <span className="text-muted-foreground/50">Sin descripción SEO</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                      {c._count?.products ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Input
                          type="number"
                          defaultValue={c.utilityPercent}
                          className="w-16 px-2 py-1.5 text-right tabular-nums"
                          onBlur={(e) => updatePercent(c, 'utilityPercent', e.target.value)}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                        {savedId === c.id + 'utilityPercent' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Input
                          type="number"
                          defaultValue={c.discountPercent}
                          className="w-16 px-2 py-1.5 text-right tabular-nums"
                          onBlur={(e) => updatePercent(c, 'discountPercent', e.target.value)}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                        {savedId === c.id + 'discountPercent' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openSeoModal(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, filtered.length)} de {filtered.length}{' '}
                registros
              </span>
              <div className="flex items-center gap-1.5">
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ‹
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Button
                    key={n}
                    size="icon"
                    variant={n === page ? 'default' : 'outline'}
                    className="h-8 w-8 text-sm"
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={seoDialogOpen} onOpenChange={setSeoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>SEO — {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea rows={2} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Palabras clave</Label>
              <Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="plumas, bolígrafos, escritura" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSeoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveSeo} disabled={isSaving}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
