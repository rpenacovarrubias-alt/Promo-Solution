import { useNavigate } from 'react-router-dom'
import { Truck, Package, Users, FileText, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'

const statCards = [
  { title: 'Proveedores activos', value: '12', icon: Truck, color: 'text-blue-600' },
  { title: 'Total productos', value: '1,847', icon: Package, color: 'text-green-600' },
  { title: 'Clientes', value: '98', icon: Users, color: 'text-purple-600' },
  { title: 'Cotizaciones este mes', value: '34', icon: FileText, color: 'text-orange-600' },
]

type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'

const recentQuotes: {
  id: string
  folio: string
  cliente: string
  fecha: string
  total: number
  status: QuoteStatus
}[] = [
  {
    id: '1',
    folio: 'COT-0034',
    cliente: 'Empresa ABC S.A.',
    fecha: '2026-03-20',
    total: 15600,
    status: 'SENT',
  },
  {
    id: '2',
    folio: 'COT-0033',
    cliente: 'Grupo XYZ',
    fecha: '2026-03-19',
    total: 8200,
    status: 'ACCEPTED',
  },
  {
    id: '3',
    folio: 'COT-0032',
    cliente: 'Constructora Norte',
    fecha: '2026-03-18',
    total: 32400,
    status: 'DRAFT',
  },
  {
    id: '4',
    folio: 'COT-0031',
    cliente: 'Distribuidora Sur',
    fecha: '2026-03-17',
    total: 5800,
    status: 'REJECTED',
  },
  {
    id: '5',
    folio: 'COT-0030',
    cliente: 'Tech Solutions',
    fecha: '2026-03-15',
    total: 21000,
    status: 'ACCEPTED',
  },
]

const statusConfig: Record<QuoteStatus, { label: string; variant: 'gray' | 'info' | 'success' | 'destructive' }> = {
  DRAFT: { label: 'Borrador', variant: 'gray' },
  SENT: { label: 'Enviada', variant: 'info' },
  ACCEPTED: { label: 'Aceptada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'destructive' },
}

export default function Dashboard() {
  const navigate = useNavigate()

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
              <p className="text-3xl font-bold">{card.value}</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentQuotes.map((q) => {
                const sc = statusConfig[q.status]
                return (
                  <TableRow key={q.id} className="cursor-pointer" onClick={() => navigate('/cotizaciones')}>
                    <TableCell className="font-medium">{q.folio}</TableCell>
                    <TableCell>{q.cliente}</TableCell>
                    <TableCell>{formatDate(q.fecha)}</TableCell>
                    <TableCell>{formatCurrency(q.total)}</TableCell>
                    <TableCell>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/cotizaciones')}>
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
