import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Trash2,
  Loader2,
  User,
  Package,
  Scissors,
  Mail,
  MessageCircle,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
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
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  markupPercent: string
}

interface Product {
  id: string
  name: string
  category?: { id: string; name: string }
  basePrice: string
  provider: { name: string }
  images: { url: string; isPrimary: boolean }[]
}

interface Service {
  id: string
  name: string
  type: string
  unitPrice: string
}

interface Provider {
  id: string
  name: string
}

type Channel = 'EMAIL' | 'WHATSAPP' | 'TELEGRAM'

interface CartItem {
  key: string
  type: 'product' | 'service'
  id: string
  name: string
  providerName?: string
  basePrice: number
  quantity: number
  markup: number
  subtotal: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calcSubtotal = (basePrice: number, quantity: number, markup: number) =>
  basePrice * quantity * (1 + markup / 100)

const IVA_RATE = 0.16

const CHANNELS: { value: Channel; label: string; icon: React.ElementType }[] = [
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
  { value: 'TELEGRAM', label: 'Telegram', icon: Send },
]

// ─── Step indicators ─────────────────────────────────────────────────────────

const STEPS = ['Seleccionar cliente', 'Agregar productos', 'Resumen y envío']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  done && 'bg-primary text-primary-foreground',
                  active && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  !done && !active && 'bg-muted text-muted-foreground',
                )}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium whitespace-nowrap',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'mb-5 h-px w-16 sm:w-24 mx-2 transition-colors',
                  done ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Seleccionar cliente ──────────────────────────────────────────────

function Step1Cliente({
  selected,
  onSelect,
}: {
  selected: Client | null
  onSelect: (c: Client) => void
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then(setClients)
      .catch(() => toast.error('Error al cargar clientes'))
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase()) ||
          (c.company ?? '').toLowerCase().includes(search.toLowerCase()),
      ),
    [clients, search],
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar cliente por nombre, empresa o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No se encontraron clientes.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((c) => {
            const isSelected = selected?.id === c.id
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent',
                  isSelected && 'border-primary bg-primary/5 ring-2 ring-primary/20',
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{c.name}</p>
                  {c.company && (
                    <p className="truncate text-xs text-muted-foreground">{c.company}</p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    Utilidad: {c.markupPercent}%
                  </Badge>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Agregar productos ────────────────────────────────────────────────

function Step2Productos({
  cart,
  defaultMarkup,
  onCartChange,
}: {
  cart: CartItem[]
  defaultMarkup: number
  onCartChange: (cart: CartItem[]) => void
}) {
  const [tab, setTab] = useState<'productos' | 'servicios'>('productos')
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterProvider, setFilterProvider] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/services').then((r) => r.json()),
      fetch('/api/providers').then((r) => r.json()),
    ])
      .then(([prods, svcs, provs]) => {
        setProducts(prods)
        setServices(svcs)
        setProviders(provs)
      })
      .catch(() => toast.error('Error al cargar catálogo'))
      .finally(() => setIsLoading(false))
  }, [])

  const categories = useMemo(
    () =>
      Array.from(
        new Map(products.filter((p) => p.category).map((p) => [p.category!.id, p.category!])).values()
      ),
    [products],
  )

  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        const matchSearch =
          !search || p.name.toLowerCase().includes(search.toLowerCase())
        const matchProvider = filterProvider === 'all' || p.provider.name === filterProvider
        const matchCategory = filterCategory === 'all' || p.category?.id === filterCategory
        return matchSearch && matchProvider && matchCategory
      }),
    [products, search, filterProvider, filterCategory],
  )

  const filteredServices = useMemo(
    () =>
      services.filter(
        (s) => !search || s.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [services, search],
  )

  const addProduct = (p: Product) => {
    const key = `product-${p.id}`
    const existing = cart.find((i) => i.key === key)
    if (existing) {
      onCartChange(
        cart.map((i) =>
          i.key === key
            ? { ...i, quantity: i.quantity + 1, subtotal: calcSubtotal(i.basePrice, i.quantity + 1, i.markup) }
            : i,
        ),
      )
    } else {
      const basePrice = parseFloat(p.basePrice)
      const markup = defaultMarkup
      onCartChange([
        ...cart,
        {
          key,
          type: 'product',
          id: p.id,
          name: p.name,
          providerName: p.provider.name,
          basePrice,
          quantity: 1,
          markup,
          subtotal: calcSubtotal(basePrice, 1, markup),
        },
      ])
    }
  }

  const addService = (s: Service) => {
    const key = `service-${s.id}`
    const existing = cart.find((i) => i.key === key)
    if (existing) {
      onCartChange(
        cart.map((i) =>
          i.key === key
            ? { ...i, quantity: i.quantity + 1, subtotal: calcSubtotal(i.basePrice, i.quantity + 1, i.markup) }
            : i,
        ),
      )
    } else {
      const basePrice = parseFloat(s.unitPrice)
      const markup = defaultMarkup
      onCartChange([
        ...cart,
        {
          key,
          type: 'service',
          id: s.id,
          name: s.name,
          basePrice,
          quantity: 1,
          markup,
          subtotal: calcSubtotal(basePrice, 1, markup),
        },
      ])
    }
  }

  const updateItem = (key: string, field: 'quantity' | 'markup', value: number) => {
    onCartChange(
      cart.map((i) => {
        if (i.key !== key) return i
        const updated = { ...i, [field]: value }
        return { ...updated, subtotal: calcSubtotal(updated.basePrice, updated.quantity, updated.markup) }
      }),
    )
  }

  const removeItem = (key: string) => onCartChange(cart.filter((i) => i.key !== key))

  const cartTotal = cart.reduce((sum, i) => sum + i.subtotal, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Left: catalog */}
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('productos')}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              tab === 'productos'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            <Package className="h-4 w-4" /> Productos
          </button>
          <button
            onClick={() => setTab('servicios')}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              tab === 'servicios'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            <Scissors className="h-4 w-4" /> Servicios
          </button>
        </div>

        {/* Search + filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={tab === 'productos' ? 'Buscar producto...' : 'Buscar servicio...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {tab === 'productos' && (
            <>
              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {/* Catalog list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tab === 'productos' ? (
          <div className="max-h-[400px] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Precio base</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p) => {
                    const primary = p.images.find((i) => i.isPrimary) ?? p.images[0]
                    const inCart = cart.some((i) => i.key === `product-${p.id}`)
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          {primary ? (
                            <img
                              src={primary.url}
                              alt={p.name}
                              className="h-9 w-9 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-md bg-muted" />
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{p.name}</p>
                          {p.category && (
                            <p className="text-xs text-muted-foreground">{p.category.name}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {p.provider.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatCurrency(parseFloat(p.basePrice))}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={inCart ? 'secondary' : 'default'}
                            onClick={() => addProduct(p)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precio unitario</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No se encontraron servicios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((s) => {
                    const inCart = cart.some((i) => i.key === `service-${s.id}`)
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-sm">{s.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {s.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatCurrency(parseFloat(s.unitPrice))}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={inCart ? 'secondary' : 'default'}
                            onClick={() => addService(s)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Right: cart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Items seleccionados</h3>
          <Badge variant="outline">{cart.length}</Badge>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <Package className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Agrega productos o servicios</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.key} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    {item.providerName && (
                      <p className="text-xs text-muted-foreground">{item.providerName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Base: {formatCurrency(item.basePrice)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.key)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.key, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">% Utilidad</Label>
                    <Input
                      type="number"
                      min="0"
                      max="1000"
                      step="0.5"
                      value={item.markup}
                      onChange={(e) =>
                        updateItem(item.key, 'markup', parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Precio c/util.: {formatCurrency(item.basePrice * (1 + item.markup / 100))}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA (16%)</span>
              <span className="font-medium">{formatCurrency(cartTotal * IVA_RATE)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(cartTotal * (1 + IVA_RATE))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 3: Resumen y envío ──────────────────────────────────────────────────

function Step3Resumen({
  client,
  cart,
  notes,
  channels,
  onNotesChange,
  onChannelsChange,
}: {
  client: Client
  cart: CartItem[]
  notes: string
  channels: Channel[]
  onNotesChange: (v: string) => void
  onChannelsChange: (v: Channel[]) => void
}) {
  const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0)
  const iva = subtotal * IVA_RATE
  const total = subtotal + iva

  const toggleChannel = (ch: Channel) =>
    onChannelsChange(
      channels.includes(ch) ? channels.filter((c) => c !== ch) : [...channels, ch],
    )

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Items summary */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{client.name}</p>
                {client.company && (
                  <p className="text-sm text-muted-foreground">{client.company}</p>
                )}
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Productos y servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">P. unitario</TableHead>
                  <TableHead className="text-right">% Util.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell>
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.providerName && (
                        <p className="text-xs text-muted-foreground">{item.providerName}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.basePrice * (1 + item.markup / 100))}
                    </TableCell>
                    <TableCell className="text-right">{item.markup}%</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas adicionales (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Instrucciones especiales, condiciones de entrega, etc."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Right: totals + channels */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Totales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA (16%)</span>
              <span className="font-medium">{formatCurrency(iva)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Canal de envío</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CHANNELS.map(({ value, label, icon: Icon }) => {
              const active = channels.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleChannel(value)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'hover:bg-accent text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {active && (
                    <span className="ml-auto text-xs font-semibold text-primary">✓</span>
                  )}
                </button>
              )
            })}
            <p className="text-xs text-muted-foreground pt-1">
              Selecciona uno o más canales para enviar la cotización.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NuevaCotizacion() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [notes, setNotes] = useState('')
  const [channels, setChannels] = useState<Channel[]>(['EMAIL'])
  const [isSaving, setIsSaving] = useState(false)

  const defaultMarkup = selectedClient ? parseFloat(selectedClient.markupPercent) : 30

  // Validation per step
  const canProceed =
    step === 0 ? !!selectedClient : step === 1 ? cart.length > 0 : channels.length > 0

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => setStep((s) => s - 1)

  const handleSave = async (asDraft: boolean) => {
    if (!selectedClient) return
    setIsSaving(true)

    const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0)
    const iva = subtotal * IVA_RATE
    const total = subtotal + iva

    const payload = {
      clientId: selectedClient.id,
      channels: asDraft ? [] : channels,
      subtotal: subtotal.toFixed(2),
      iva: iva.toFixed(2),
      total: total.toFixed(2),
      notes: notes || null,
      status: asDraft ? 'DRAFT' : 'SENT',
      items: cart.map((item) => ({
        productId: item.type === 'product' ? item.id : null,
        serviceId: item.type === 'service' ? item.id : null,
        quantity: item.quantity,
        unitPrice: item.basePrice.toFixed(2),
        markup: item.markup.toFixed(2),
        subtotal: item.subtotal.toFixed(2),
      })),
    }

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(asDraft ? 'Cotización guardada como borrador' : 'Cotización creada y enviada')
      navigate('/cotizaciones')
    } catch {
      toast.error('Error al guardar la cotización')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva cotización</h1>
          <p className="text-muted-foreground">Crea una cotización para tu cliente</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/cotizaciones')}>
          Cancelar
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center">
        <StepIndicator current={step} />
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {step === 0 && (
            <Step1Cliente selected={selectedClient} onSelect={setSelectedClient} />
          )}
          {step === 1 && (
            <Step2Productos
              cart={cart}
              defaultMarkup={defaultMarkup}
              onCartChange={setCart}
            />
          )}
          {step === 2 && selectedClient && (
            <Step3Resumen
              client={selectedClient}
              cart={cart}
              notes={notes}
              channels={channels}
              onNotesChange={setNotes}
              onChannelsChange={setChannels}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        <div className="flex gap-3">
          {step === 2 && (
            <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Guardar borrador
            </Button>
          )}

          {step < 2 ? (
            <Button onClick={handleNext} disabled={!canProceed}>
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => handleSave(false)} disabled={isSaving || !canProceed}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Crear cotización
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
