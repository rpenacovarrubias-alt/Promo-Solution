import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface Provider {
  id: string
  name: string
  logo?: string
  isActive: boolean
  totalProducts: number
  lastSync: string | null
  syncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'
  syncMessage?: string | null
}

interface SyncLog {
  id: string
  provider: { name: string }
  status: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'
  message?: string | null
  productsAdded: number
  productsUpdated: number
  productsTotal: number
  startedAt: string
}

// Misma paleta usada en categorias.html / colecciones.html — badges consistentes en todo el dashboard.
const PALETTE = ['#17264A', '#C9A15A', '#5C6577', '#B02A2A', '#1E8E5A', '#2C4A8C']
function colorFor(name: string) {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PALETTE[hash % PALETTE.length]
}

function StatusBadge({ status, isSyncing }: { status: Provider['syncStatus']; isSyncing: boolean }) {
  if (isSyncing || status === 'SYNCING') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: '#A8823F' }}>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: '#C9A15A' }} />
        Sincronizando...
      </span>
    )
  }
  if (status === 'ERROR') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: '#B02A2A' }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#B02A2A' }} />
        Error
      </span>
    )
  }
  if (status === 'SUCCESS') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: '#1E8E5A' }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#1E8E5A' }} />
        Sincronizado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
      Sin sincronizar
    </span>
  )
}

function ResultBadge({ status }: { status: SyncLog['status'] }) {
  if (status === 'SUCCESS')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: '#1E8E5A' }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#1E8E5A' }} />
        Exitoso
      </span>
    )
  if (status === 'ERROR')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: '#B02A2A' }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#B02A2A' }} />
        Error
      </span>
    )
  return <span className="text-xs font-medium text-muted-foreground">En curso</span>
}

export default function Catalogos() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())

  const fetchAll = useCallback(async () => {
    try {
      const [provRes, logsRes] = await Promise.all([fetch('/api/providers'), fetch('/api/sync')])
      if (provRes.ok) setProviders(await provRes.json())
      if (logsRes.ok) setLogs(await logsRes.json())
    } catch {
      toast.error('Error al cargar catálogos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleSync = async (providerId: string) => {
    setSyncingIds((prev) => new Set(prev).add(providerId))
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Sincronización completada: ${data.productsAdded} nuevos, ${data.productsUpdated} actualizados`)
      await fetchAll()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al sincronizar catálogo')
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev)
        next.delete(providerId)
        return next
      })
    }
  }

  const handleSyncAll = () => {
    providers.filter((p) => p.isActive).forEach((p) => handleSync(p.id))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogos</h1>
          <p className="text-muted-foreground">Sincroniza los catálogos de tus proveedores conectados</p>
        </div>
        <div className="h-64 animate-pulse rounded-xl border bg-muted/30" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogos</h1>
          <p className="text-muted-foreground">Sincroniza los catálogos de tus proveedores conectados</p>
        </div>
        <Button onClick={handleSyncAll} disabled={syncingIds.size > 0}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sincronizar todos
        </Button>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
          No hay proveedores configurados. Agrega uno en la sección de{' '}
          <a href="/proveedores" className="text-navy underline">
            Proveedores
          </a>
          .
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Proveedor</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Productos</th>
                <th className="px-5 py-3 font-medium">Última sincronización</th>
                <th className="w-40 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => {
                const isSyncing = syncingIds.has(p.id)
                return (
                  <tr key={p.id} className={cnRow(p.isActive)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                          style={{ background: colorFor(p.name) }}
                        >
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={p.syncStatus} isSyncing={isSyncing} />
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                      {p.totalProducts.toLocaleString('es-MX')}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {p.lastSync ? formatDate(p.lastSync) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSyncing || !p.isActive}
                        onClick={() => handleSync(p.id)}
                      >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sincronizar
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-semibold text-foreground">Historial de sincronización</h2>
        <div className="overflow-hidden rounded-xl border bg-card">
          {logs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay sincronizaciones registradas.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Proveedor</th>
                  <th className="px-5 py-3 font-medium">Resultado</th>
                  <th className="px-5 py-3 text-right font-medium">Nuevos</th>
                  <th className="px-5 py-3 text-right font-medium">Actualizados</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-5 py-3.5 text-muted-foreground">{formatDate(log.startedAt)}</td>
                    <td className="px-5 py-3.5 font-medium">{log.provider.name}</td>
                    <td className="px-5 py-3.5">
                      <ResultBadge status={log.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                      {log.status === 'ERROR' ? '—' : log.productsAdded}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                      {log.status === 'ERROR' ? '—' : log.productsUpdated}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                      {log.status === 'ERROR' ? '—' : log.productsTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function cnRow(isActive: boolean) {
  return `border-t ${isActive ? '' : 'opacity-50'}`
}
