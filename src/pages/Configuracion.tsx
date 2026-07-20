import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import TabGenerales from './configuracion/TabGenerales'
import TabProductos from './configuracion/TabProductos'
import TabCotizaciones from './configuracion/TabCotizaciones'
import TabCabecera from './configuracion/TabCabecera'
import TabPiePagina from './configuracion/TabPiePagina'

const APP_VERSION = '1.0.0'

const TABS = [
  { key: 'generales', label: 'Generales', defaultMenu: 'notificaciones' },
  { key: 'productos', label: 'Productos', defaultMenu: 'configuraciones' },
  { key: 'cotizaciones', label: 'Cotizaciones', defaultMenu: 'general' },
  { key: 'cabecera', label: 'Cabecera', defaultMenu: 'menu' },
  { key: 'piePagina', label: 'Pie de página', defaultMenu: 'menu' },
  { key: 'sistema', label: 'Sistema', defaultMenu: '' },
]

type ConfigMap = Record<string, string>

export default function Configuracion() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'generales'
  const activeMenu = searchParams.get('menu') ?? (TABS.find((t) => t.key === activeTab)?.defaultMenu ?? '')

  const [config, setConfig] = useState<ConfigMap>({})
  const [isLoading, setIsLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown')

  useEffect(() => {
    fetch('/api/config')
      .then((r) => {
        if (!r.ok) throw new Error()
        setDbStatus('connected')
        return r.json()
      })
      .then((data) => setConfig(data))
      .catch(() => {
        setDbStatus('disconnected')
        toast.error('No se pudo cargar la configuración')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const setTab = (tab: string) => {
    const defaultMenu = TABS.find((t) => t.key === tab)?.defaultMenu ?? ''
    setSearchParams({ tab, menu: defaultMenu })
  }

  const setMenu = (menu: string) => {
    setSearchParams({ tab: activeTab, menu })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Ajustes del sistema y del sitio web</p>
      </div>

      {/* Tab bar */}
      <div className="border-b">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'generales' && (
            <TabGenerales config={config} activeMenu={activeMenu} onMenuChange={setMenu} />
          )}
          {activeTab === 'productos' && (
            <TabProductos config={config} activeMenu={activeMenu} onMenuChange={setMenu} />
          )}
          {activeTab === 'cotizaciones' && (
            <TabCotizaciones config={config} activeMenu={activeMenu} onMenuChange={setMenu} />
          )}
          {activeTab === 'cabecera' && (
            <TabCabecera config={config} activeMenu={activeMenu} onMenuChange={setMenu} />
          )}
          {activeTab === 'piePagina' && (
            <TabPiePagina config={config} activeMenu={activeMenu} onMenuChange={setMenu} />
          )}
          {activeTab === 'sistema' && <SistemaTab dbStatus={dbStatus} />}
        </>
      )}
    </div>
  )
}

// ── Tab Sistema (existente, sin cambios) ──────────────────────────────────────
function SistemaTab({
  dbStatus,
}: {
  dbStatus: 'connected' | 'disconnected' | 'unknown'
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del sistema</CardTitle>
        <CardDescription>Estado de servicios y versión de la aplicación</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Base de datos</p>
            <p className="text-sm text-muted-foreground">PostgreSQL via Prisma ORM</p>
          </div>
          <div className="flex items-center gap-2">
            {dbStatus === 'connected' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Conectado</span>
              </>
            ) : dbStatus === 'disconnected' ? (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">Desconectado</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Verificando...</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Versión de la aplicación</p>
            <p className="text-sm text-muted-foreground">Promo Solution Admin Panel</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            v{APP_VERSION}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Stack tecnológico</p>
            <p className="text-sm text-muted-foreground">
              React 18 · TypeScript · Vite 5 · Tailwind CSS · Prisma
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Plataforma de despliegue</p>
            <p className="text-sm text-muted-foreground">Vercel (Serverless Functions)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
