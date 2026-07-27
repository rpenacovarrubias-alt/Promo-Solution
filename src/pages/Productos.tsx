import { useState, useEffect, type MouseEvent } from 'react'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight, LayoutGrid, List, Package, Eye, EyeOff, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
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
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'

const PAGE_SIZE = 40

interface ProductImage {
  id: string
  url: string
  isPrimary: boolean
}

interface ProductColor {
  id: string
  colorName: string
  hex?: string
}

interface ProductVariant {
  id: string
  material?: string
  size?: string
  minQty: number
}

interface Product {
  id: string
  externalId: string
  name: string
  description?: string
  category?: { id: string; name: string }
  basePrice: string
  isActive: boolean
  isVisible: boolean
  isFeatured: boolean
  provider: { id: string; name: string }
  images: ProductImage[]
  colors: ProductColor[]
  variants: ProductVariant[]
}

interface Provider {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface Pagination {
  page: number
  totalPages: number
  total: number
}

export default function Productos() {
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 })
  const [providers, setProviders] = useState<Provider[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterProvider, setFilterProvider] = useState('all')
  const [page, setPage] = useState(1)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)

  // Catálogos de filtros — independientes de la página de productos visible
  useEffect(() => {
    fetch('/api/providers').then((r) => r.ok && r.json()).then((d) => d && setProviders(d)).catch(() => {})
    fetch('/api/categories').then((r) => r.ok && r.json()).then((d) => d && setCategories(d)).catch(() => {})
  }, [])

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  // Fetch de productos — server-side: búsqueda, filtros y paginación reales
  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    if (filterCategory !== 'all') params.set('categoryId', filterCategory)
    if (filterProvider !== 'all') params.set('providerId', filterProvider)

    fetch(`/api/products?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((res) => {
        setProducts(res.data)
        setPagination(res.pagination)
      })
      .catch(() => toast.error('Error al cargar productos'))
      .finally(() => setIsLoading(false))
  }, [page, search, filterCategory, filterProvider])

  const openDetail = (product: Product) => {
    setSelectedProduct(product)
    setCarouselIndex(0)
  }

  const toggleFlag = async (e: MouseEvent, product: Product, field: 'isVisible' | 'isFeatured') => {
    e.stopPropagation()
    const value = !product[field]
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, [field]: value } : p)))
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, [field]: !value } : p)))
      toast.error('Error al actualizar producto')
    }
  }

  const pageNumbers = (() => {
    const { page: current, totalPages } = pagination
    const nums = new Set([1, totalPages, current, current - 1, current + 1].filter((n) => n >= 1 && n <= totalPages))
    return Array.from(nums).sort((a, b) => a - b)
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Catálogo completo de productos
            {pagination.total > 0 && (
              <span className="font-semibold text-foreground"> — {pagination.total.toLocaleString('es-MX')} productos</span>
            )}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre o código..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1) }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterProvider} onValueChange={(v) => { setFilterProvider(v); setPage(1) }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proveedores</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            size="icon"
            variant={view === 'grid' ? 'default' : 'ghost'}
            className="h-8 w-8"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={view === 'table' ? 'default' : 'ghost'}
            className="h-8 w-8"
            onClick={() => setView('table')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenido */}
      {isLoading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )
      ) : products.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent>
            <p className="text-muted-foreground">No se encontraron productos</p>
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p, i) => {
            const primaryImage = p.images.find((img) => img.isPrimary) ?? p.images[0]
            return (
              <button
                key={p.id}
                onClick={() => openDetail(p)}
                style={{ animationDelay: `${(i % PAGE_SIZE) * 15}ms` }}
                className="group animate-in fade-in slide-in-from-bottom-1 overflow-hidden rounded-xl border bg-card text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-navy to-navy-mid">
                  {primaryImage ? (
                    <img
                      src={primaryImage.url}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-10 w-10 text-white/40" />
                    </div>
                  )}
                  <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <span
                      role="button"
                      onClick={(e) => toggleFlag(e, p, 'isFeatured')}
                      title={p.isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md bg-white/90 hover:bg-white',
                        p.isFeatured ? 'text-gold' : 'text-slate-400',
                      )}
                    >
                      <Star className="h-3.5 w-3.5" fill={p.isFeatured ? 'currentColor' : 'none'} />
                    </span>
                    <span
                      role="button"
                      onClick={(e) => toggleFlag(e, p, 'isVisible')}
                      title={p.isVisible ? 'Ocultar del sitio' : 'Mostrar en el sitio'}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md bg-white/90 hover:bg-white',
                        p.isVisible ? 'text-navy' : 'text-slate-400',
                      )}
                    >
                      {p.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                </div>
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">{p.name}</p>
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        p.isActive ? 'bg-emerald-500' : 'border border-muted-foreground/30',
                      )}
                      title={p.isActive ? 'Activo' : 'Inactivo'}
                    />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {p.externalId} · {p.provider.name}
                  </p>
                  {p.colors.length > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                      {p.colors.slice(0, 5).map((c) => (
                        <span
                          key={c.id}
                          title={c.colorName}
                          className="h-3.5 w-3.5 rounded-full border border-border"
                          style={{ backgroundColor: c.hex || '#9CA3AF' }}
                        />
                      ))}
                    </div>
                  )}
                  <p className="mt-2.5 font-bold tabular-nums text-foreground">
                    {formatCurrency(parseFloat(p.basePrice))}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio base</TableHead>
                  <TableHead>Colores</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Sitio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const primaryImage = p.images.find((img) => img.isPrimary) ?? p.images[0]
                  return (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => openDetail(p)}>
                      <TableCell>
                        {primaryImage ? (
                          <img src={primaryImage.url} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.provider.name}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.category?.name ?? '—'}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(p.basePrice))}</TableCell>
                      <TableCell>{p.colors.length}</TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? 'success' : 'secondary'}>
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn('h-8 w-8', p.isFeatured ? 'text-gold' : 'text-muted-foreground')}
                            onClick={(e) => toggleFlag(e, p, 'isFeatured')}
                            title={p.isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
                          >
                            <Star className="h-4 w-4" fill={p.isFeatured ? 'currentColor' : 'none'} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn('h-8 w-8', !p.isVisible && 'text-muted-foreground')}
                            onClick={(e) => toggleFlag(e, p, 'isVisible')}
                            title={p.isVisible ? 'Ocultar del sitio' : 'Mostrar en el sitio'}
                          >
                            {p.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            Mostrando {(pagination.page - 1) * PAGE_SIZE + 1}–{Math.min(pagination.page * PAGE_SIZE, pagination.total)} de{' '}
            {pagination.total.toLocaleString('es-MX')} productos
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbers.map((n, i) => (
              <span key={n} className="flex items-center">
                {i > 0 && pageNumbers[i - 1] !== n - 1 && <span className="px-1 text-muted-foreground">…</span>}
                <Button
                  size="icon"
                  variant={n === pagination.page ? 'default' : 'outline'}
                  className="h-8 w-8 text-sm"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              </span>
            ))}
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Product Detail Dialog */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              {/* Image carousel */}
              {selectedProduct.images.length > 0 && (
                <div className="relative">
                  <img
                    src={selectedProduct.images[carouselIndex]?.url}
                    alt={selectedProduct.name}
                    className="h-56 w-full rounded-lg bg-muted object-contain"
                  />
                  {selectedProduct.images.length > 1 && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setCarouselIndex((i) => (i === 0 ? selectedProduct.images.length - 1 : i - 1))
                        }
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {carouselIndex + 1} / {selectedProduct.images.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setCarouselIndex((i) => (i === selectedProduct.images.length - 1 ? 0 : i + 1))
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {selectedProduct.description && (
                <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
              )}

              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-medium">Precio base:</span>{' '}
                  {formatCurrency(parseFloat(selectedProduct.basePrice))}
                </div>
                <div>
                  <span className="font-medium">Categoría:</span> {selectedProduct.category?.name ?? '—'}
                </div>
                <div>
                  <span className="font-medium">Proveedor:</span> {selectedProduct.provider.name}
                </div>
              </div>

              {/* Color swatches */}
              {selectedProduct.colors.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Colores disponibles</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colors.map((c) => (
                      <div key={c.id} className="flex items-center gap-1.5">
                        {c.hex && (
                          <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.hex }} />
                        )}
                        <span className="text-xs">{c.colorName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants table */}
              {selectedProduct.variants.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Variantes</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Talla</TableHead>
                        <TableHead>Cantidad mín.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProduct.variants.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell>{v.material ?? '—'}</TableCell>
                          <TableCell>{v.size ?? '—'}</TableCell>
                          <TableCell>{v.minQty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
