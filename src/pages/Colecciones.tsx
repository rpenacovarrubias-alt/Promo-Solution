import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Package, Wand2, Search, X } from 'lucide-react'
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
import { RECOMMENDATION_ICONS, iconFor } from '@/lib/recommendationIcons'

// Recomendaciones = modelo Collection. Grupos temáticos (Navidad, Fitness...) con productos
// de CUALQUIER proveedor; el sitio público las muestra en el menú "Recomendaciones".
interface Collection {
  id: string
  code: string
  name: string
  seoDescription?: string | null
  matchKeywords?: string | null
  icon?: string | null
  sortOrder: number
  isActive: boolean
  _count?: { products: number }
}

interface MemberProduct {
  id: string
  name: string
  basePrice: string
  isActive: boolean
  provider: { id: string; name: string }
  images: { url: string }[]
}

interface Members {
  data: MemberProduct[]
  byProvider: { provider: string; count: number }[]
  pagination: { total: number }
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

const money = (v: string | number) => `$${parseFloat(String(v)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

export default function Colecciones() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [managing, setManaging] = useState<Collection | null>(null)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [matchKeywords, setMatchKeywords] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [isActive, setIsActive] = useState(true)

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch('/api/collections')
      if (!res.ok) throw new Error()
      setCollections(await res.json())
    } catch {
      toast.error('Error al cargar recomendaciones')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setIcon('')
    setMatchKeywords('')
    setSeoDesc('')
    setSortOrder(String((collections.at(-1)?.sortOrder ?? 0) + 10))
    setIsActive(true)
    setDialogOpen(true)
  }

  const openEdit = (c: Collection) => {
    setEditing(c)
    setName(c.name)
    setIcon(c.icon ?? '')
    setMatchKeywords(c.matchKeywords ?? '')
    setSeoDesc(c.seoDescription ?? '')
    setSortOrder(String(c.sortOrder))
    setIsActive(c.isActive)
    setDialogOpen(true)
  }

  const onSubmit = async () => {
    if (!name.trim()) return
    setIsSaving(true)
    try {
      const url = editing ? `/api/collections/${editing.id}` : '/api/collections'
      const common = { name: name.trim(), icon, matchKeywords, seoDescription: seoDesc, sortOrder: Number(sortOrder) || 0 }
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...common, isActive } : { ...common, code: slugify(name) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error)
      }
      toast.success(editing ? 'Recomendación actualizada' : 'Recomendación creada')
      setDialogOpen(false)
      fetchCollections()
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/collections/${deletingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Recomendación eliminada')
      setDeleteDialogOpen(false)
      setDeletingId(null)
      fetchCollections()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const header = (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Recomendaciones</h1>
      <p className="text-muted-foreground">
        Grupos temáticos que se muestran en el sitio. Cada uno puede mezclar productos de todos tus proveedores.
      </p>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="h-48 animate-pulse rounded-xl border bg-muted/30" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {header}
        <Button onClick={openCreate} className="shrink-0 self-start">
          <Plus className="mr-2 h-4 w-4" />
          Nueva recomendación
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {collections.map((c) => {
          const Icon = iconFor(c.icon)
          const count = c._count?.products ?? 0
          return (
            <div key={c.id} className="group flex flex-col rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={c.isActive ? { background: '#EAF7EF', color: '#1E8E5A' } : { background: '#F1F5F9', color: '#64748B' }}
                >
                  {c.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mb-3 text-xs text-muted-foreground">
                {count === 0 ? 'Sin productos — no se muestra en el sitio' : `${count} producto${count === 1 ? '' : 's'}`}
              </div>
              <div className="mt-auto flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setManaging(c)}>
                  <Package className="mr-1.5 h-3.5 w-3.5" />
                  Productos
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Editar ${c.name}`} onClick={() => openEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  aria-label={`Eliminar ${c.name}`}
                  onClick={() => { setDeletingId(c.id); setDeleteDialogOpen(true) }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {collections.length === 0 && (
        <div className="rounded-xl border bg-card py-14 text-center text-sm text-muted-foreground">
          Aún no hay recomendaciones. Crea la primera con “Nueva recomendación”.
        </div>
      )}

      {/* Crear / editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar recomendación' : 'Nueva recomendación'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input placeholder="Ej. Regreso a clases" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Icono</Label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(RECOMMENDATION_ICONS).map(([key, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    title={key}
                    aria-label={key}
                    aria-pressed={icon === key}
                    onClick={() => setIcon(key)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                      icon === key ? 'border-navy bg-navy text-white' : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Palabras clave para autollenar</Label>
              <Textarea
                rows={2}
                placeholder="navidad, esfera, santa, reno"
                value={matchKeywords}
                onChange={(e) => setMatchKeywords(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Separadas por coma. Se buscan en el <strong>nombre</strong> del producto (sin importar acentos ni
                mayúsculas, palabra completa) entre todos los proveedores. <code>%</code> es comodín: boligrafo%azul.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Descripción (se muestra en el sitio y en SEO)</Label>
              <Textarea rows={2} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Orden en el menú</Label>
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </div>
              {editing && (
                <div className="flex items-end gap-3 pb-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <span className="text-sm font-medium">Activa</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={isSaving}>
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar recomendación</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro? Solo se elimina la recomendación; los productos no se borran.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {managing && (
        <ProductsDialog
          collection={managing}
          onClose={() => { setManaging(null); fetchCollections() }}
        />
      )}
    </div>
  )
}

// ── Productos de una recomendación ────────────────────────────────────────────
function ProductsDialog({ collection, onClose }: { collection: Collection; onClose: () => void }) {
  const [members, setMembers] = useState<Members | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MemberProduct[]>([])
  const [searching, setSearching] = useState(false)
  const [filling, setFilling] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${collection.id}/products?limit=100`)
      if (!res.ok) throw new Error()
      setMembers(await res.json())
    } catch {
      toast.error('Error al cargar los productos')
    }
  }, [collection.id])

  useEffect(() => {
    load()
  }, [load])

  const memberIds = new Set(members?.data.map((p) => p.id))

  const search = async () => {
    if (query.trim().length < 2) return
    setSearching(true)
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query.trim())}&limit=20`)
      if (!res.ok) throw new Error()
      setResults((await res.json()).data)
    } catch {
      toast.error('Error al buscar')
    } finally {
      setSearching(false)
    }
  }

  const add = async (productId: string) => {
    const res = await fetch(`/api/collections/${collection.id}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: [productId] }),
    })
    if (!res.ok) return toast.error('No se pudo agregar')
    load()
  }

  const remove = async (productId: string) => {
    const res = await fetch(`/api/collections/${collection.id}/products/${productId}`, { method: 'DELETE' })
    if (!res.ok) return toast.error('No se pudo quitar')
    load()
  }

  const autofill = async () => {
    setFilling(true)
    try {
      const res = await fetch(`/api/collections/${collection.id}/autofill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error)
      const detail = Object.entries(data.byProvider as Record<string, number>)
        .map(([p, n]) => `${p}: ${n}`)
        .join(' · ')
      toast.success(`${data.added} producto${data.added === 1 ? '' : 's'} agregado${data.added === 1 ? '' : 's'}`, {
        description: detail || 'No hubo coincidencias',
      })
      load()
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : 'Error al autollenar')
    } finally {
      setFilling(false)
    }
  }

  const row = (p: MemberProduct, action: React.ReactNode) => (
    <li key={p.id} className="flex items-center gap-3 py-2">
      {p.images[0]?.url ? (
        <img src={p.images[0].url} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-md border object-cover" />
      ) : (
        <span className="h-10 w-10 shrink-0 rounded-md border bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{p.name}</div>
        <div className="text-xs text-muted-foreground">
          {p.provider.name} · {money(p.basePrice)}
          {!p.isActive && <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">inactivo</span>}
        </div>
      </div>
      {action}
    </li>
  )

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Productos — {collection.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={autofill} disabled={filling || !collection.matchKeywords}>
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
            {filling ? 'Buscando…' : 'Autollenar por palabras clave'}
          </Button>
          {!collection.matchKeywords && (
            <span className="text-xs text-muted-foreground">Agrega palabras clave en “Editar” para usarlo.</span>
          )}
        </div>

        {members && members.byProvider.length > 0 && (
          <div className="flex flex-wrap gap-1.5 text-xs">
            {members.byProvider.map((b) => (
              <span key={b.provider} className="rounded-full bg-muted px-2.5 py-1">
                {b.provider}: <strong>{b.count}</strong>
              </span>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label>Agregar un producto (de cualquier proveedor)</Label>
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); search() }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por nombre o descripción…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Button type="submit" variant="outline" disabled={searching}>Buscar</Button>
          </form>
          {results.length > 0 && (
            <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border px-3">
              {results.map((p) =>
                row(
                  p,
                  memberIds.has(p.id) ? (
                    <span className="text-xs text-muted-foreground">Ya está</span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => add(p.id)}>
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Agregar
                    </Button>
                  ),
                ),
              )}
            </ul>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-hidden">
          <Label>
            En esta recomendación {members ? `(${members.pagination.total})` : ''}
          </Label>
          <div className="max-h-[38vh] overflow-y-auto rounded-lg border px-3">
            {!members ? (
              <div className="h-24 animate-pulse" />
            ) : members.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin productos todavía.</p>
            ) : (
              <ul className="divide-y">
                {members.data.map((p) =>
                  row(
                    p,
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Quitar ${p.name}`} onClick={() => remove(p.id)}>
                      <X className="h-4 w-4" />
                    </Button>,
                  ),
                )}
              </ul>
            )}
          </div>
          {members && members.pagination.total > members.data.length && (
            <p className="text-xs text-muted-foreground">Mostrando los {members.data.length} más recientes.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
