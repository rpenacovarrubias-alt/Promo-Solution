import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Loader2, RefreshCw, Plug,
  CheckCircle2, XCircle, Clock, AlertCircle, Package,
} from 'lucide-react'
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
  DialogDescription,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatDate } from '@/lib/utils'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type AuthType = 'BEARER' | 'GRAPHQL' | 'WEBSERVICE' | 'MANUAL'
type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'

interface Provider {
  id: string
  name: string
  slug: string
  authType: AuthType
  apiUrl: string | null
  apiUser: string | null
  accountId: string | null
  logo: string | null
  isActive: boolean
  lastSync: string | null
  syncStatus: SyncStatus
  syncMessage: string | null
  totalProducts: number
  createdAt: string
  updatedAt: string
}

// ─── Schema de validación ─────────────────────────────────────────────────────

const providerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  authType: z.enum(['BEARER', 'GRAPHQL', 'WEBSERVICE', 'MANUAL']),
  apiUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  logo: z.string().url('URL inválida').optional().or(z.literal('')),
  apiKey: z.string().optional(),
  apiUser: z.string().optional(),
  apiPassword: z.string().optional(),
  accountId: z.string().optional(),
})

type ProviderForm = z.infer<typeof providerSchema>

// ─── Constantes de UI ─────────────────────────────────────────────────────────

const AUTH_LABELS: Record<AuthType, string> = {
  BEARER: 'Bearer Token',
  GRAPHQL: 'GraphQL Login',
  WEBSERVICE: 'Web Service',
  MANUAL: 'Manual (Excel)',
}

const AUTH_VARIANTS: Record<AuthType, 'info' | 'cyan' | 'warning' | 'gray'> = {
  BEARER: 'info',
  GRAPHQL: 'cyan',
  WEBSERVICE: 'warning',
  MANUAL: 'gray',
}

type SyncVariant = 'success' | 'destructive' | 'secondary' | 'warning'

const SYNC_CONFIG: Record<SyncStatus, { label: string; icon: React.ReactNode; variant: SyncVariant }> = {
  IDLE:    { label: 'Sin sincronizar', icon: <Clock className="h-3 w-3" />,                          variant: 'secondary' },
  SYNCING: { label: 'Sincronizando…',  icon: <Loader2 className="h-3 w-3 animate-spin" />,           variant: 'warning' },
  SUCCESS: { label: 'Actualizado',     icon: <CheckCircle2 className="h-3 w-3" />,                   variant: 'success' },
  ERROR:   { label: 'Error',           icon: <XCircle className="h-3 w-3" />,                        variant: 'destructive' },
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Proveedores() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProviderForm>({
    resolver: zodResolver(providerSchema),
    defaultValues: { authType: 'BEARER' },
  })

  // Observar authType para campos dinámicos
  const authType = useWatch({ control, name: 'authType' }) as AuthType

  // Auto-generar slug al escribir nombre (solo en creación)
  const nameValue = useWatch({ control, name: 'name' })
  useEffect(() => {
    if (!editingProvider && nameValue) {
      setValue('slug', slugify(nameValue))
    }
  }, [nameValue, editingProvider, setValue])

  // ── Fetch ──────────────────────────────────────────────────────────────────

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

  useEffect(() => { fetchProviders() }, [])

  // ── Dialogs ────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingProvider(null)
    reset({ name: '', slug: '', authType: 'BEARER', apiUrl: '', apiKey: '', apiUser: '', apiPassword: '', accountId: '', logo: '' })
    setDialogOpen(true)
  }

  const openEdit = (p: Provider) => {
    setEditingProvider(p)
    reset({
      name: p.name,
      slug: p.slug,
      authType: p.authType,
      apiUrl: p.apiUrl ?? '',
      apiKey: '',           // nunca devuelto por el servidor
      apiUser: p.apiUser ?? '',
      apiPassword: '',      // nunca devuelto por el servidor
      accountId: p.accountId ?? '',
      logo: p.logo ?? '',
    })
    setDialogOpen(true)
  }

  const openDelete = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const onSubmit = async (data: ProviderForm) => {
    // Validaciones condicionales según authType
    if (data.authType === 'BEARER' && !editingProvider && !data.apiKey?.trim()) {
      toast.error('El Bearer Token es requerido')
      return
    }
    if ((data.authType === 'GRAPHQL' || data.authType === 'WEBSERVICE') && !data.apiUser?.trim()) {
      toast.error('El usuario/email es requerido')
      return
    }
    if ((data.authType === 'GRAPHQL' || data.authType === 'WEBSERVICE') && !editingProvider && !data.apiPassword?.trim()) {
      toast.error('La contraseña es requerida')
      return
    }

    setIsSaving(true)
    try {
      // Omitir campos vacíos para no sobreescribir credenciales existentes con ''
      const payload: Record<string, unknown> = { ...data }
      if (!payload.apiKey) delete payload.apiKey
      if (!payload.apiPassword) delete payload.apiPassword
      if (!payload.apiUrl) delete payload.apiUrl
      if (!payload.logo) delete payload.logo
      if (!payload.accountId) delete payload.accountId

      const url = editingProvider ? `/api/providers/${editingProvider.id}` : '/api/providers'
      const method = editingProvider ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Error al guardar')
      }
      toast.success(editingProvider ? 'Proveedor actualizado' : 'Proveedor creado')
      setDialogOpen(false)
      fetchProviders()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar proveedor')
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

  // ── Sync / Test ────────────────────────────────────────────────────────────

  const handleSync = async (providerId: string, providerName: string) => {
    setSyncingId(providerId)
    setProviders(prev => prev.map(p => p.id === providerId ? { ...p, syncStatus: 'SYNCING' } : p))
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, action: 'sync' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error en sincronización')
      toast.success(`${providerName} — ${data.productsAdded} nuevos, ${data.productsUpdated} actualizados`)
      fetchProviders()
    } catch (e: unknown) {
      toast.error(`Error en ${providerName}: ${e instanceof Error ? e.message : 'desconocido'}`)
      fetchProviders()
    } finally {
      setSyncingId(null)
    }
  }

  const handleTestConnection = async (providerId: string, providerName: string) => {
    setTestingId(providerId)
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, action: 'test' }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || data.message || 'Conexión fallida')
      toast.success(`✅ ${data.message || `Conexión exitosa con ${providerName}`}`)
    } catch (e: unknown) {
      toast.error(`❌ ${e instanceof Error ? e.message : `No se pudo conectar con ${providerName}`}`)
    } finally {
      setTestingId(null)
    }
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  const activeCount = providers.filter(p => p.isActive).length
  const totalProducts = providers.reduce((sum, p) => sum + (p.totalProducts ?? 0), 0)
  const syncedCount = providers.filter(p => p.syncStatus === 'SUCCESS').length

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
            <p className="text-muted-foreground">Gestiona credenciales y sincronización de catálogos</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Plug className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{providers.length}</p>
                  <p className="text-xs text-muted-foreground">{activeCount} activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Package className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalProducts.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">productos totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{syncedCount}</p>
                  <p className="text-xs text-muted-foreground">sincronizados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de proveedores */}
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
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Tipo Auth</TableHead>
                    <TableHead>Estado Sync</TableHead>
                    <TableHead>Última Sync</TableHead>
                    <TableHead className="text-right"># Productos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No hay proveedores registrados. Agrega el primero.
                      </TableCell>
                    </TableRow>
                  ) : (
                    providers.map((p) => {
                      const sync = SYNC_CONFIG[p.syncStatus]
                      const isSyncing = syncingId === p.id
                      const isTesting = testingId === p.id

                      return (
                        <TableRow key={p.id} className={!p.isActive ? 'opacity-50' : ''}>

                          {/* Nombre + slug + logo */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {p.logo ? (
                                <img src={p.logo} alt={p.name} className="h-7 w-7 rounded object-contain" />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                                  {p.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-medium leading-tight">{p.name}</p>
                                <p className="font-mono text-xs text-muted-foreground">{p.slug}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Auth type badge */}
                          <TableCell>
                            <Badge variant={AUTH_VARIANTS[p.authType]}>
                              {AUTH_LABELS[p.authType]}
                            </Badge>
                          </TableCell>

                          {/* Sync status */}
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Badge
                                    variant={sync.variant}
                                    className="flex w-fit cursor-default items-center gap-1"
                                  >
                                    {isSyncing
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : sync.icon}
                                    {isSyncing ? 'Sincronizando…' : sync.label}
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              {p.syncMessage && (
                                <TooltipContent side="top">{p.syncMessage}</TooltipContent>
                              )}
                            </Tooltip>
                          </TableCell>

                          {/* Última sync */}
                          <TableCell className="text-sm text-muted-foreground">
                            {p.lastSync ? (
                              <Tooltip>
                                <TooltipTrigger className="cursor-default">
                                  {timeAgo(p.lastSync)}
                                </TooltipTrigger>
                                <TooltipContent>{formatDate(p.lastSync)}</TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs italic">Nunca</span>
                            )}
                          </TableCell>

                          {/* # Productos */}
                          <TableCell className="text-right font-mono text-sm">
                            {p.totalProducts > 0 ? p.totalProducts.toLocaleString() : '—'}
                          </TableCell>

                          {/* Acciones */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">

                              {/* Probar conexión */}
                              {p.authType !== 'MANUAL' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={isTesting || isSyncing || !p.isActive}
                                      onClick={() => handleTestConnection(p.id, p.name)}
                                    >
                                      {isTesting
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <Plug className="h-4 w-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Probar conexión</TooltipContent>
                                </Tooltip>
                              )}

                              {/* Sincronizar catálogo */}
                              {p.authType !== 'MANUAL' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={isSyncing || isTesting || !p.isActive}
                                      onClick={() => handleSync(p.id, p.name)}
                                    >
                                      {isSyncing
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <RefreshCw className="h-4 w-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Sincronizar catálogo</TooltipContent>
                                </Tooltip>
                              )}

                              {/* Editar */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>

                              {/* Eliminar */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => openDelete(p.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar</TooltipContent>
                              </Tooltip>
                            </div>
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

        {/* ── Dialog Crear / Editar ──────────────────────────────────────────── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </DialogTitle>
              <DialogDescription>
                Las credenciales se guardan cifradas y nunca se devuelven en respuestas GET.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Nombre */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" placeholder="Innovation S.A." {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="slug">
                  Slug *
                  <span className="ml-1 text-xs text-muted-foreground">(identificador único del adaptador)</span>
                </Label>
                <Input id="slug" placeholder="innovation" className="font-mono text-sm" {...register('slug')} />
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
              </div>

              {/* Tipo de autenticación */}
              <div className="space-y-1.5">
                <Label>Tipo de autenticación *</Label>
                <Select
                  defaultValue={editingProvider?.authType ?? 'BEARER'}
                  onValueChange={(val) => setValue('authType', val as AuthType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEARER">
                      Bearer Token — token pre-emitido (Innovation, 4Promotional)
                    </SelectItem>
                    <SelectItem value="GRAPHQL">
                      GraphQL Login — usuario + contraseña (Promo Option)
                    </SelectItem>
                    <SelectItem value="WEBSERVICE">
                      Web Service — login + cuenta (Doble Vela)
                    </SelectItem>
                    <SelectItem value="MANUAL">
                      Manual — importación desde Excel
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* API URL (todos excepto MANUAL) */}
              {authType !== 'MANUAL' && (
                <div className="space-y-1.5">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    placeholder="https://api.proveedor.com"
                    {...register('apiUrl')}
                  />
                  {errors.apiUrl && <p className="text-xs text-destructive">{errors.apiUrl.message}</p>}
                </div>
              )}

              {/* ── Campos dinámicos por authType ─────────────────────────── */}

              {/* BEARER */}
              {authType === 'BEARER' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="apiKey">
                      Bearer Token {!editingProvider && '*'}
                      {editingProvider && (
                        <span className="ml-1 text-xs text-muted-foreground">(vacío = no cambiar)</span>
                      )}
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder={editingProvider ? '••••••••' : 'Token del portal del proveedor'}
                      {...register('apiKey')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="accountId">
                      ID de cuenta
                      <span className="ml-1 text-xs text-muted-foreground">(opcional — ej. 22100)</span>
                    </Label>
                    <Input id="accountId" placeholder="22100" {...register('accountId')} />
                  </div>
                </>
              )}

              {/* GRAPHQL */}
              {authType === 'GRAPHQL' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="apiUser">Email / Usuario *</Label>
                    <Input id="apiUser" type="email" placeholder="usuario@ejemplo.com" {...register('apiUser')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apiPassword">
                      Contraseña {!editingProvider && '*'}
                      {editingProvider && (
                        <span className="ml-1 text-xs text-muted-foreground">(vacío = no cambiar)</span>
                      )}
                    </Label>
                    <Input
                      id="apiPassword"
                      type="password"
                      placeholder={editingProvider ? '••••••••' : 'Contraseña de acceso'}
                      {...register('apiPassword')}
                    />
                  </div>
                </>
              )}

              {/* WEBSERVICE */}
              {authType === 'WEBSERVICE' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="apiUser">Email / Usuario *</Label>
                    <Input id="apiUser" type="email" placeholder="usuario@ejemplo.com" {...register('apiUser')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apiPassword">
                      Contraseña {!editingProvider && '*'}
                      {editingProvider && (
                        <span className="ml-1 text-xs text-muted-foreground">(vacío = no cambiar)</span>
                      )}
                    </Label>
                    <Input
                      id="apiPassword"
                      type="password"
                      placeholder={editingProvider ? '••••••••' : 'Contraseña de acceso'}
                      {...register('apiPassword')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="accountId">
                      ID de cuenta
                      <span className="ml-1 text-xs text-muted-foreground">(ej. C010535)</span>
                    </Label>
                    <Input id="accountId" placeholder="C010535" {...register('accountId')} />
                  </div>
                </>
              )}

              {/* MANUAL — aviso */}
              {authType === 'MANUAL' && (
                <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Este proveedor usa importación manual desde Excel. No requiere credenciales de API.
                  </span>
                </div>
              )}

              {/* Logo URL */}
              <div className="space-y-1.5">
                <Label htmlFor="logo">
                  Logo URL
                  <span className="ml-1 text-xs text-muted-foreground">(opcional)</span>
                </Label>
                <Input id="logo" placeholder="https://…/logo.png" {...register('logo')} />
                {errors.logo && <p className="text-xs text-destructive">{errors.logo.message}</p>}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProvider ? 'Actualizar' : 'Crear proveedor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Dialog Confirmar Eliminar ──────────────────────────────────────── */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar proveedor</DialogTitle>
              <DialogDescription>
                Esta acción eliminará el proveedor y <strong>todos sus productos</strong> asociados en la base de datos.
                No se puede deshacer.
              </DialogDescription>
            </DialogHeader>
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
    </TooltipProvider>
  )
}
