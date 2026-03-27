import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Save, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

const APP_VERSION = '1.0.0'

interface Config {
  ivaPercent: string
  defaultMarkup: string
  companyName: string
  logoUrl: string
}

export default function Configuracion() {
  const [config, setConfig] = useState<Config>({
    ivaPercent: '16',
    defaultMarkup: '30',
    companyName: 'Promo Solution',
    logoUrl: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error()
      toast.success('Configuración guardada correctamente')
    } catch {
      toast.error('Error al guardar configuración')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Ajustes generales del sistema</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración general</CardTitle>
              <CardDescription>Parámetros de cálculo y datos de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ivaPercent">IVA (%)</Label>
                      <Input
                        id="ivaPercent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={config.ivaPercent}
                        onChange={(e) => setConfig((c) => ({ ...c, ivaPercent: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Porcentaje de IVA aplicado a cotizaciones
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultMarkup">Utilidad por defecto (%)</Label>
                      <Input
                        id="defaultMarkup"
                        type="number"
                        min="0"
                        max="1000"
                        step="0.01"
                        value={config.defaultMarkup}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, defaultMarkup: e.target.value }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Porcentaje de utilidad aplicado a nuevos clientes
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nombre de la empresa</Label>
                      <Input
                        id="companyName"
                        placeholder="Promo Solution"
                        value={config.companyName}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, companyName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">URL del logo</Label>
                      <Input
                        id="logoUrl"
                        type="url"
                        placeholder="https://..."
                        value={config.logoUrl}
                        onChange={(e) => setConfig((c) => ({ ...c, logoUrl: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar cambios
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sistema Tab */}
        <TabsContent value="sistema">
          <Card>
            <CardHeader>
              <CardTitle>Información del sistema</CardTitle>
              <CardDescription>Estado de servicios y versión de la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
