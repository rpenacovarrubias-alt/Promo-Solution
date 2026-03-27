import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatCurrency } from '@/lib/utils'

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
  name: string
  description?: string
  category?: { id: string; name: string }
  basePrice: string
  isActive: boolean
  provider: { id: string; name: string }
  images: ProductImage[]
  colors: ProductColor[]
  variants: ProductVariant[]
}

interface Provider {
  id: string
  name: string
}

export default function Productos() {
  const [products, setProducts] = useState<Product[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterProvider, setFilterProvider] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, provRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/providers'),
        ])
        if (prodRes.ok) setProducts(await prodRes.json())
        if (provRes.ok) setProviders(await provRes.json())
      } catch {
        toast.error('Error al cargar productos')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const categories = Array.from(
    new Map(products.filter((p) => p.category).map((p) => [p.category!.id, p.category!])).values()
  )

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || p.category?.id === filterCategory
    const matchProvider = filterProvider === 'all' || p.provider.id === filterProvider
    return matchSearch && matchCategory && matchProvider
  })

  const openDetail = (product: Product) => {
    setSelectedProduct(product)
    setCarouselIndex(0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
        <p className="text-muted-foreground">Catálogo completo de productos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44">
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
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-44">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => {
                    const primaryImage = p.images.find((i) => i.isPrimary) ?? p.images[0]
                    return (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => openDetail(p)}
                      >
                        <TableCell>
                          {primaryImage ? (
                            <img
                              src={primaryImage.url}
                              alt={p.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
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
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Product Detail Dialog */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Image carousel */}
              {selectedProduct.images.length > 0 && (
                <div className="relative">
                  <img
                    src={selectedProduct.images[carouselIndex]?.url}
                    alt={selectedProduct.name}
                    className="h-56 w-full rounded-lg object-contain bg-muted"
                  />
                  {selectedProduct.images.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setCarouselIndex((i) =>
                            i === 0 ? selectedProduct.images.length - 1 : i - 1,
                          )
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
                          setCarouselIndex((i) =>
                            i === selectedProduct.images.length - 1 ? 0 : i + 1,
                          )
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
                  <span className="font-medium">Categoría:</span>{' '}
                  {selectedProduct.category?.name ?? '—'}
                </div>
                <div>
                  <span className="font-medium">Proveedor:</span>{' '}
                  {selectedProduct.provider.name}
                </div>
              </div>

              {/* Color swatches */}
              {selectedProduct.colors.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Colores disponibles</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colors.map((c) => (
                      <div key={c.id} className="flex items-center gap-1.5">
                        {c.hex && (
                          <div
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: c.hex }}
                          />
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
                  <p className="text-sm font-medium mb-2">Variantes</p>
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
