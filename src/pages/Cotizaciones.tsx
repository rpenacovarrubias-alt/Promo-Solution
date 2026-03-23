import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Eye, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
type Channel = 'EMAIL' | 'WHATSAPP' | 'TELEGRAM'

interface QuoteItem {
  id: string
  quantity: number
  unitPrice: string
  markup: string
  subtotal: string
  product?: { name: string }
  service?: { name: string }
}

interface Quote {
  id: string
  client: { name: string; email: string }
  status: QuoteStatus
  channels: Channel[]
  subtotal: string
  iva: string
  total: string
  notes?: string
  items: QuoteItem[]
  createdAt: string
}

const statusConfig: Record<QuoteStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Borrador', className: 'bg-gray-100 text-gray-800' },
  SENT: { label: 'Enviada', className: 'bg-blue-100 text-blue-800' },
  ACCEPTED: { label: 'Aceptada', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rechazada', className: 'bg-red-100 text-red-800' },
}

const channelConfig: Record<Channel, { label: string; className: string }> = {
  EMAIL: { label: 'Email', className: 'bg-blue-100 text-blue-800' },
  WHATSAPP: { label: 'WhatsApp', className: 'bg-green-100 text-green-800' },
  TELEGRAM: { label: 'Telegram', className: 'bg-cyan-100 text-cyan-800' },
}

export default function Cotizaciones() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await fetch('/api/quotes')
        if (!res.ok) throw new Error()
        setQuotes(await res.json())
      } catch {
        toast.error('Error al cargar cotizaciones')
      } finally {
        setIsLoading(false)
      }
    }
    fetchQuotes()
  }, [])

  const handleResend = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Cotización reenviada correctamente')
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: 'SENT' } : q)),
      )
    } catch {
      toast.error('Error al reenviar cotización')
    }
  }

  const getFolioNumber = (index: number) => `COT-${String(index + 1).padStart(4, '0')}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cotizaciones</h1>
        <p className="text-muted-foreground">Historial de cotizaciones enviadas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de cotizaciones</CardTitle>
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
                  <TableHead>Folio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Canales</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      No hay cotizaciones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  quotes.map((q, index) => {
                    const sc = statusConfig[q.status]
                    return (
                      <TableRow key={q.id}>
                        <TableCell className="font-mono font-medium text-sm">
                          {getFolioNumber(index)}
                        </TableCell>
                        <TableCell>{q.client.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(q.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {q.channels.map((ch) => {
                              const cc = channelConfig[ch]
                              return (
                                <span
                                  key={ch}
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cc.className}`}
                                >
                                  {cc.label}
                                </span>
                              )
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.className}`}
                          >
                            {sc.label}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(parseFloat(q.subtotal))}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(q.iva))}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(parseFloat(q.total))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedQuote(q)}
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResend(q.id)}
                              title="Reenviar"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
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

      {/* Quote Detail Dialog */}
      {selectedQuote && (
        <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalle de cotización — {selectedQuote.client.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="font-medium">Cliente:</span> {selectedQuote.client.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedQuote.client.email}
                </div>
                <div>
                  <span className="font-medium">Fecha:</span> {formatDate(selectedQuote.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Estado:</span>{' '}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusConfig[selectedQuote.status].className}`}
                  >
                    {statusConfig[selectedQuote.status].label}
                  </span>
                </div>
              </div>

              {selectedQuote.notes && (
                <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                  {selectedQuote.notes}
                </p>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto/Servicio</TableHead>
                    <TableHead>Cant.</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>% Util.</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedQuote.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.name ?? item.service?.name ?? '—'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(item.unitPrice))}</TableCell>
                      <TableCell>{item.markup}%</TableCell>
                      <TableCell>{formatCurrency(parseFloat(item.subtotal))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-1 text-sm text-right">
                <div>
                  Subtotal: <span className="font-medium">{formatCurrency(parseFloat(selectedQuote.subtotal))}</span>
                </div>
                <div>
                  IVA (16%): <span className="font-medium">{formatCurrency(parseFloat(selectedQuote.iva))}</span>
                </div>
                <div className="text-base">
                  Total:{' '}
                  <span className="font-bold">{formatCurrency(parseFloat(selectedQuote.total))}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
