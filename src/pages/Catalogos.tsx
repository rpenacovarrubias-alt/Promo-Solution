import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { RefreshCw, Package, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface Provider {
  id: string
  name: string
  logo?: string
  isActive: boolean
  _count?: { products: number }
  updatedAt: string
}

export default function Catalogos() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
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
    fetchProviders()
  }, [])

  const handleSync = async (providerId: string) => {
    setSyncingIds((prev) => new Set(prev).add(providerId))
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(`Sincronización completada: ${data.synced ?? 0} productos actualizados`)
      // Refresh providers
      const provRes = await fetch('/api/providers')
      if (provRes.ok) setProviders(await provRes.json())
    } catch {
      toast.error('Error al sincronizar catálogo')
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev)
        next.delete(providerId)
        return next
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogos</h1>
          <p className="text-muted-foreground">Sincroniza los catálogos de tus proveedores</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24 mt-1" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catálogos</h1>
        <p className="text-muted-foreground">Sincroniza los catálogos de tus proveedores</p>
      </div>

      {providers.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent>
            <p className="text-muted-foreground">
              No hay proveedores configurados. Agrega uno en la sección de{' '}
              <a href="/proveedores" className="text-primary underline">
                Proveedores
              </a>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => {
            const isSyncing = syncingIds.has(p.id)
            return (
              <Card key={p.id} className={!p.isActive ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {p.logo ? (
                        <img
                          src={p.logo}
                          alt={p.name}
                          className="h-10 w-10 rounded-md object-contain"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <Badge
                          variant={p.isActive ? 'success' : 'secondary'}
                          className="mt-1 text-[10px]"
                        >
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Package className="h-3.5 w-3.5" />
                      {p._count?.products ?? 0} productos
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(p.updatedAt)}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={isSyncing || !p.isActive}
                    onClick={() => handleSync(p.id)}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
