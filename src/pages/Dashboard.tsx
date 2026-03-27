import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Package, Users, FileText, Plus, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'

type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'

interface RecentQuote {
  id: string
  status: QuoteStatus
  total: string
  createdAt: string
  client: { name: string; company?: string }
}

interface DashboardData {
  stats: {
    providers: number
    products: number
    clients: number
    quotesThisMonth: number
  }
  recentQuotes: RecentQuote[]
}

const statusConfig: Record<QuoteStatus, { label: string; variant: 'gray' | 'info' | 'success' | 'destructive' }> = {
  DRAFT: { label: 'Borrador', variant: 'gray' },
  SENT: { label: 'Enviada', variant: 'info' },
  ACCEPTED: { label: 'Aceptada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'destructive' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const statCards = [
    {
      title: 'Proveedores activos',
      value: data?.stats.providers ?? 0,
      icon: Truck,
      color: 'text-blue-600',
    },
    {
      title: 'Total productos',
      value: data?.stats.products ?? 0,
      icon: Package,
      color: 'text-green-600',
    },
    {
      title: 'Clientes',
      value: data?.stats.clients ?? 0,
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Cotizaciones este mes',
      value: data?.stats.quotesThisMonth ?? 0,
      icon: FileText,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del sistema</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <p className="text-3xl font-bold">{card.value.toLocaleString('es-MX')}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent quotes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.recentQuotes.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay cotizaciones. Crea la primera.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentQuotes.map((q) => {
                  const sc = statusConfig[q.status]
                  return (
                    <TableRow
                      key={q.id}
                      className="cursor-pointer"
                      onClick={() => navigate('/cotizaciones')}
                    >
                      <TableCell className="font-medium">{q.client.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {q.client.company || '—'}
                      </TableCell>
                      <TableCell>{formatDate(q.createdAt)}</TableCell>
                      <TableCell>{formatCurrency(q.total)}</TableCell>
                      <TableCell>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/cotizaciones/nueva')}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva cotización
          </Button>
          <Button variant="outline" onClick={() => navigate('/clientes')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo cliente
          </Button>
          <Button variant="outline" onClick={() => navigate('/catalogos')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar catálogos
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
