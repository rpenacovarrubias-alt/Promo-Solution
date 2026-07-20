import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Loader2, UserCog, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils'

// ─── Tipos ─────────────────────────────────────────────────────────────────────

type UserRole = 'ADMIN' | 'SALES_MANAGER' | 'SELLER'

interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
}

// ─── Helpers de rol ────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:         'Administrador',
  SALES_MANAGER: 'Gerente de Ventas',
  SELLER:        'Vendedor',
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN:         'bg-amber-500 text-white',
  SALES_MANAGER: 'bg-green-800  text-white',
  SELLER:        'bg-blue-600   text-white',
}

// ─── Schemas ───────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name:     z.string().min(1, 'El nombre es requerido'),
  email:    z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role:     z.enum(['ADMIN', 'SALES_MANAGER', 'SELLER']),
})

const editSchema = z.object({
  name:     z.string().min(1, 'El nombre es requerido'),
  email:    z.string().email('Correo inválido'),
  password: z.string().optional().or(z.literal('')),
  role:     z.enum(['ADMIN', 'SALES_MANAGER', 'SELLER']),
})

type UserForm = {
  name: string
  email: string
  password?: string
  role: UserRole
}

// ─── Constantes de paginación ─────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// ─── Componente principal ──────────────────────────────────────────────────────

export default function Usuarios() {
  const [users,       setUsers]       = useState<AppUser[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [dialogOpen,  setDialogOpen]  = useState(false)
  const [editing,     setEditing]     = useState<AppUser | null>(null)
  const [isSaving,    setIsSaving]    = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('SELLER')

  // Búsqueda y paginación
  const [search,    setSearch]    = useState('')
  const [pageSize,  setPageSize]  = useState(10)
  const [page,      setPage]      = useState(1)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(editing ? editSchema : createSchema) as any,
  })

  // ── Carga de datos ────────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error()
      setUsers(await res.json())
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  // ── Filtrado y paginación ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return users
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [users, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIdx = (currentPage - 1) * pageSize
  const endIdx   = Math.min(startIdx + pageSize, filtered.length)
  const paginated = filtered.slice(startIdx, endIdx)

  // Reset a página 1 cuando cambia la búsqueda o el tamaño
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handlePageSize = (v: number) => { setPageSize(v); setPage(1) }

  // ── Dialog ────────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null)
    setSelectedRole('SELLER')
    reset({ name: '', email: '', password: '', role: 'SELLER' })
    setDialogOpen(true)
  }

  const openEdit = (u: AppUser) => {
    setEditing(u)
    setSelectedRole(u.role)
    reset({ name: u.name, email: u.email, password: '', role: u.role })
    setDialogOpen(true)
  }

  const onSubmit = async (data: UserForm) => {
    setIsSaving(true)
    try {
      const payload = { ...data, role: selectedRole }
      if (editing && !payload.password) delete payload.password

      const url    = editing ? `/api/users/${editing.id}` : '/api/users'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Usuario actualizado' : 'Usuario creado')
      setDialogOpen(false)
      fetchUsers()
    } catch {
      toast.error('Error al guardar usuario')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (u: AppUser) => {
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !u.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(u.isActive ? 'Usuario desactivado' : 'Usuario activado')
      fetchUsers()
    } catch {
      toast.error('Error al actualizar estatus')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los accesos al panel de administración</p>
        </div>
        <Button onClick={openCreate} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Tabla + controles */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Barra de controles */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Mostrar
            <select
              value={pageSize}
              onChange={(e) => handlePageSize(Number(e.target.value))}
              className="h-8 rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            registros
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-8 pl-8 w-48 text-sm"
            />
          </div>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCog className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? 'Sin resultados para tu búsqueda.' : 'No hay usuarios registrados.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Usuario
                  <span className="ml-1 text-xs opacity-60">↕</span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Tipo
                  <span className="ml-1 text-xs opacity-60">↕</span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estatus</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((u, i) => (
                <tr
                  key={u.id}
                  className={cn(
                    'border-b last:border-0 transition-colors hover:bg-muted/30',
                    i % 2 === 0 ? 'bg-white' : 'bg-muted/10',
                  )}
                >
                  {/* Columna: Usuario (nombre + email) */}
                  <td className="px-4 py-3">
                    <p className="font-semibold">{u.name}</p>
                    <a
                      href={`mailto:${u.email}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {u.email}
                    </a>
                  </td>

                  {/* Columna: Tipo (badge grande coloreado) */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex w-44 items-center justify-center rounded-sm px-3 py-1.5 text-xs font-semibold',
                        ROLE_COLORS[u.role],
                      )}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>

                  {/* Columna: Estatus */}
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(u)} title="Clic para cambiar estatus">
                      <span
                        className={cn(
                          'inline-flex w-24 items-center justify-center gap-1 rounded-sm border px-3 py-1.5 text-xs font-medium',
                          u.isActive
                            ? 'border-green-300 bg-green-50 text-green-700'
                            : 'border-red-200   bg-red-50   text-red-600',
                        )}
                      >
                        {u.isActive ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </button>
                  </td>

                  {/* Columna: Acción */}
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      onClick={() => openEdit(u)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer: contador + paginación */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
            <span>
              Del {startIdx + 1} al {endIdx} de {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 px-3 text-xs"
              >
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  variant={n === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(n)}
                  className="h-7 w-7 p-0 text-xs"
                >
                  {n}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 px-3 text-xs"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialog crear / editar ──────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input placeholder="Juan García" {...register('name')} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => {
                    setSelectedRole(v as UserRole)
                    setValue('role', v as UserRole)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="SALES_MANAGER">Gerente de Ventas</SelectItem>
                    <SelectItem value="SELLER">Vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="juan@promosolution.mx"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                {editing
                  ? 'Nueva contraseña (dejar vacío para no cambiar)'
                  : 'Contraseña *'}
              </Label>
              <Input type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
