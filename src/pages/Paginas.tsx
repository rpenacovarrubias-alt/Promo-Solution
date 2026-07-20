import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Save, Loader2, Plus, Trash2, ExternalLink, AlertTriangle,
  ChevronDown, ChevronUp, ImageIcon, Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface Page {
  id: string
  slug: string
  title: string
  status: 'PUBLIC' | 'INACTIVE'
  isSystem: boolean
  seoImageUrl: string | null
  seoKeywords: string | null
  seoDescription: string | null
  extraContent: string | null
  sortOrder: number
}

interface Slide {
  id: string
  imageUrl: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaUrl: string
}

const SITE_URL = 'https://promosolution.com.mx'

// ─── Componente principal ──────────────────────────────────────────────────────

export default function Paginas() {
  const { slug } = useParams<{ slug: string }>()
  const navigate  = useNavigate()

  const [pages,      setPages]      = useState<Page[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showNewDlg, setShowNewDlg] = useState(false)

  const loadPages = useCallback(async () => {
    try {
      const res  = await fetch('/api/pages')
      const data = await res.json()
      setPages(data)
      // Si no hay slug activo, navegar al primero
      if (!slug && data.length > 0) {
        navigate(`/paginas/${data[0].slug}`, { replace: true })
      }
    } catch {
      toast.error('Error al cargar páginas')
    } finally {
      setLoading(false)
    }
  }, [slug, navigate])

  useEffect(() => { loadPages() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activePage = pages.find((p) => p.slug === slug)

  const handleDelete = async (s: string) => {
    if (!confirm('¿Eliminar esta página? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/pages/${s}`, { method: 'DELETE' })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success('Página eliminada')
      const remaining = pages.filter((p) => p.slug !== s)
      setPages(remaining)
      navigate(`/paginas/${remaining[0]?.slug ?? ''}`, { replace: true })
    } catch (e: any) {
      toast.error(e.message ?? 'Error al eliminar')
    }
  }

  const handleCreate = async (title: string) => {
    try {
      const res  = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const page: Page = await res.json()
      setPages((prev) => [...prev, page])
      setShowNewDlg(false)
      toast.success(`Página "${page.title}" creada`)
      navigate(`/paginas/${page.slug}`)
    } catch (e: any) {
      toast.error(e.message ?? 'Error al crear página')
    }
  }

  const handlePageUpdate = (updated: Page) => {
    setPages((prev) => prev.map((p) => (p.slug === updated.slug ? updated : p)))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Páginas</h1>
        <p className="text-muted-foreground">
          Administra las páginas de tu sitio web y su posicionamiento en buscadores
        </p>
      </div>

      <div className="flex gap-0 min-h-[600px] rounded-lg border bg-card overflow-hidden">
        {/* ── Sidebar izquierdo ─────────────────────────────────── */}
        <div className="w-52 shrink-0 border-r flex flex-col">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                {pages.map((page) => (
                  <button
                    key={page.slug}
                    onClick={() => navigate(`/paginas/${page.slug}`)}
                    className={cn(
                      'w-full text-left px-4 py-3 text-sm transition-colors hover:bg-accent flex items-center justify-between gap-2',
                      slug === page.slug
                        ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary'
                        : 'text-muted-foreground',
                    )}
                  >
                    <span className="truncate">{page.title}</span>
                    {page.status === 'INACTIVE' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowNewDlg(true)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-primary hover:bg-accent transition-colors border-t"
              >
                <Plus className="h-4 w-4" />
                Nueva página
              </button>
            </>
          )}
        </div>

        {/* ── Panel derecho ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {!activePage && !loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Selecciona una página
            </div>
          ) : activePage ? (
            <PageEditor
              key={activePage.slug}
              page={activePage}
              onUpdate={handlePageUpdate}
              onDelete={() => handleDelete(activePage.slug)}
            />
          ) : null}
        </div>
      </div>

      {/* ── Modal nueva página ─────────────────────────────────── */}
      <NewPageDialog
        open={showNewDlg}
        onClose={() => setShowNewDlg(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}

// ─── Editor de página ──────────────────────────────────────────────────────────

interface PageEditorProps {
  page: Page
  onUpdate: (p: Page) => void
  onDelete: () => void
}

function PageEditor({ page, onUpdate, onDelete }: PageEditorProps) {
  const pageUrl =
    page.slug === 'inicio'
      ? SITE_URL
      : `${SITE_URL}/${page.slug}`

  return (
    <div className="p-6 space-y-8">
      {/* Banner inactiva */}
      {page.status === 'INACTIVE' && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            <strong>Esta página está inactiva.</strong> No será visible públicamente hasta que
            cambies el estatus a <strong>Pública</strong> y guardes los cambios.
          </p>
        </div>
      )}

      {/* Botón eliminar (solo páginas no-sistema) */}
      {!page.isSystem && (
        <div className="flex justify-end">
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            Eliminar página
          </Button>
        </div>
      )}

      {/* Sección Página */}
      <PaginaSection page={page} pageUrl={pageUrl} onUpdate={onUpdate} />

      <Separator />

      {/* Sección SEO */}
      <SeoSection page={page} onUpdate={onUpdate} />

      <Separator />

      {/* Sección extra según tipo */}
      {page.slug === 'inicio' ? (
        <SliderSection page={page} onUpdate={onUpdate} />
      ) : (
        <BannerSection page={page} onUpdate={onUpdate} />
      )}
    </div>
  )
}

// ─── Sección: Página ───────────────────────────────────────────────────────────

function PaginaSection({
  page,
  pageUrl,
  onUpdate,
}: {
  page: Page
  pageUrl: string
  onUpdate: (p: Page) => void
}) {
  const [title,   setTitle]   = useState(page.title)
  const [status,  setStatus]  = useState<'PUBLIC' | 'INACTIVE'>(page.status)
  const [saving,  setSaving]  = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/pages/${page.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status }),
      })
      if (!res.ok) throw new Error()
      const updated: Page = await res.json()
      onUpdate(updated)
      toast.success('Página actualizada')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
        Página
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="page-title">Título</Label>
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir
            </a>
          </div>
          <Input
            id="page-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="page-status">Estatus</Label>
          <select
            id="page-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'PUBLIC' | 'INACTIVE')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="PUBLIC">Pública</option>
            <option value="INACTIVE">Inactiva</option>
          </select>
        </div>
      </div>

      <Button disabled={saving} onClick={save}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ─── Sección: SEO ─────────────────────────────────────────────────────────────

function SeoSection({ page, onUpdate }: { page: Page; onUpdate: (p: Page) => void }) {
  const [imageUrl,     setImageUrl]     = useState(page.seoImageUrl    ?? '')
  const [keywords,     setKeywords]     = useState(page.seoKeywords    ?? '')
  const [description,  setDescription]  = useState(page.seoDescription ?? '')
  const [saving,       setSaving]       = useState(false)
  const [showSeoInfo,  setShowSeoInfo]  = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/pages/${page.slug}/seo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoImageUrl:    imageUrl,
          seoKeywords:    keywords,
          seoDescription: description,
        }),
      })
      if (!res.ok) throw new Error()
      const updated: Page = await res.json()
      onUpdate(updated)
      toast.success('SEO actualizado')
    } catch {
      toast.error('Error al guardar SEO')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          SEO
        </h2>
        <Badge variant="secondary" className="text-xs font-normal">Opcional</Badge>
        <button
          onClick={() => setShowSeoInfo((v) => !v)}
          className="text-xs text-primary hover:underline flex items-center gap-0.5"
        >
          ¿Para qué sirve?
          {showSeoInfo ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {showSeoInfo && (
        <div className="rounded-lg bg-muted/50 border px-4 py-3 text-sm text-muted-foreground space-y-1">
          <p>El <strong>SEO</strong> (Search Engine Optimization) ayuda a que tu página aparezca en Google y otros buscadores.</p>
          <p>• <strong>Imagen:</strong> aparece cuando se comparte el enlace en redes sociales.</p>
          <p>• <strong>Palabras clave:</strong> términos por los que quieres que te encuentren.</p>
          <p>• <strong>Descripción:</strong> texto que aparece en los resultados de búsqueda (150-160 caracteres).</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Imagen SEO */}
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Imagen</p>
            <p className="text-xs text-muted-foreground">
              Tamaños recomendados: 600×315 | 600×600 píxeles.
            </p>
            <p className="text-xs text-muted-foreground">
              Si supera los 400 KB, comprime en:{' '}
              <a href="https://www.iloveimg.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                iloveimg.com
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://... URL de la imagen SEO"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="SEO preview"
                className="w-full max-h-40 object-cover rounded-lg border"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            ) : (
              <div className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground gap-2">
                <ImageIcon className="h-8 w-8 opacity-40" />
                <p className="text-xs">Sin imagen seleccionada</p>
              </div>
            )}
          </div>
        </div>

        {/* Keywords + Descripción */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Palabras clave</Label>
            <Textarea
              placeholder="Uniformes, Promocionales, Artículos publicitarios..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Separar con comas</p>
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              placeholder="Descripción de la página (150-160 caracteres recomendado)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {description.length} / 160 caracteres
              {description.length > 160 && (
                <span className="ml-1 text-destructive">— demasiado largo</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <Button disabled={saving} onClick={save}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ─── Sección: Banner (para páginas que no son Inicio) ──────────────────────────

function BannerSection({ page, onUpdate }: { page: Page; onUpdate: (p: Page) => void }) {
  const parseContent = () => {
    try { return JSON.parse(page.extraContent ?? '{}') } catch { return {} }
  }

  const [bannerUrl, setBannerUrl] = useState<string>(parseContent().banner?.imageUrl ?? '')
  const [saving,    setSaving]    = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const extraContent = { ...parseContent(), banner: { imageUrl: bannerUrl } }
      const res = await fetch(`/api/pages/${page.slug}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraContent }),
      })
      if (!res.ok) throw new Error()
      const updated: Page = await res.json()
      onUpdate(updated)
      toast.success('Banner actualizado')
    } catch {
      toast.error('Error al guardar banner')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
        Banner
      </h2>

      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Imagen</p>
          <p className="text-xs text-muted-foreground">
            Tamaño recomendado: 1400×386 píxeles.
          </p>
          <p className="text-xs text-muted-foreground">
            Si supera los 650 KB, comprime en:{' '}
            <a href="https://www.iloveimg.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              iloveimg.com
            </a>
          </p>
        </div>

        <Input
          type="url"
          placeholder="https://... URL de la imagen del banner"
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
        />

        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt="Banner preview"
            className="w-full max-h-48 object-cover rounded-lg border"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <div className="flex h-28 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground gap-2">
            <ImageIcon className="h-8 w-8 opacity-40" />
            <p className="text-xs">Sin imagen seleccionada (1400×386 px)</p>
          </div>
        )}
      </div>

      <Button disabled={saving} onClick={save}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ─── Sección: Slider (solo página Inicio) ─────────────────────────────────────

function SliderSection({ page, onUpdate }: { page: Page; onUpdate: (p: Page) => void }) {
  const parseSlides = (): Slide[] => {
    try {
      const c = JSON.parse(page.extraContent ?? '{}')
      return Array.isArray(c.slides) ? c.slides : []
    } catch { return [] }
  }

  const [slides,  setSlides]  = useState<Slide[]>(parseSlides)
  const [saving,  setSaving]  = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  const newSlide = (): Slide => ({
    id: crypto.randomUUID(), imageUrl: '', title: '', subtitle: '', ctaLabel: '', ctaUrl: '',
  })

  const addSlide = () => {
    const s = newSlide()
    setSlides((prev) => [...prev, s])
    setEditing(s.id)
  }

  const updateSlide = (id: string, field: keyof Slide, value: string) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const removeSlide = (id: string) => {
    setSlides((prev) => prev.filter((s) => s.id !== id))
    if (editing === id) setEditing(null)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/pages/${page.slug}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraContent: { slides } }),
      })
      if (!res.ok) throw new Error()
      const updated: Page = await res.json()
      onUpdate(updated)
      toast.success('Slider actualizado')
    } catch {
      toast.error('Error al guardar slider')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          Slider
        </h2>
        <Button size="sm" variant="outline" onClick={addSlide}>
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar slide
        </Button>
      </div>

      {slides.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-sm text-muted-foreground">
          Sin slides — haz clic en "Agregar slide" para empezar
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div key={slide.id} className="rounded-lg border overflow-hidden">
              {/* Header del slide */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setEditing(editing === slide.id ? null : slide.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium">
                    {slide.title || `Slide ${idx + 1}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); removeSlide(slide.id) }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  {editing === slide.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Formulario del slide */}
              {editing === slide.id && (
                <div className="px-4 pb-4 pt-2 border-t bg-muted/20 space-y-3">
                  <div className="space-y-1.5">
                    <Label>URL de imagen</Label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={slide.imageUrl}
                      onChange={(e) => updateSlide(slide.id, 'imageUrl', e.target.value)}
                    />
                    {slide.imageUrl && (
                      <img
                        src={slide.imageUrl}
                        alt="Slide preview"
                        className="w-full h-32 object-cover rounded border"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Título</Label>
                      <Input
                        value={slide.title}
                        onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subtítulo</Label>
                      <Input
                        value={slide.subtitle}
                        onChange={(e) => updateSlide(slide.id, 'subtitle', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Texto del botón CTA</Label>
                      <Input
                        placeholder="Ver productos"
                        value={slide.ctaLabel}
                        onChange={(e) => updateSlide(slide.id, 'ctaLabel', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>URL del botón CTA</Label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={slide.ctaUrl}
                        onChange={(e) => updateSlide(slide.id, 'ctaUrl', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Button disabled={saving} onClick={save}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ─── Modal: Nueva página ──────────────────────────────────────────────────────

function NewPageDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (title: string) => void
}) {
  const [title,   setTitle]   = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!title.trim()) return
    setLoading(true)
    await onCreate(title)
    setLoading(false)
    setTitle('')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setTitle('') } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva página</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="new-page-title">Título de la página</Label>
          <Input
            id="new-page-title"
            placeholder="Ej: Sobre nosotros, Blog, Servicios..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handle()}
            autoFocus
          />
          {title && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              URL: promosolution.com.mx/
              <span className="font-mono text-primary">
                {title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
              </span>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setTitle('') }}>
            Cancelar
          </Button>
          <Button disabled={!title.trim() || loading} onClick={handle}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear página
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
