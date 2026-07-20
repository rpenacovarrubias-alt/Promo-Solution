import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import SectionPanel from './SectionPanel'

const SECTIONS = [
  { key: 'configuraciones', label: 'Configuraciones' },
  { key: 'carrusel', label: 'Diseño carrusel' },
  { key: 'vistaPrevia', label: 'Diseño de vista previa' },
  { key: 'vistaDetalle', label: 'Vista detalle' },
  { key: 'coleccion', label: 'Colección destacada' },
]

type ConfigMap = Record<string, string>

interface Props {
  config: ConfigMap
  activeMenu: string
  onMenuChange: (key: string) => void
}

export default function TabProductos({ config, activeMenu, onMenuChange }: Props) {
  return (
    <SectionPanel items={SECTIONS} activeKey={activeMenu} onSelect={onMenuChange}>
      {activeMenu === 'configuraciones' && <ConfiguracionesSection config={config} />}
      {activeMenu === 'carrusel' && <CarruselSection config={config} />}
      {activeMenu === 'vistaPrevia' && <VistaPreviaSection config={config} />}
      {activeMenu === 'vistaDetalle' && <VistaDetalleSection config={config} />}
      {activeMenu === 'coleccion' && <ColeccionDestacadaSection config={config} />}
    </SectionPanel>
  )
}

function useSave() {
  const [saving, setSaving] = useState(false)
  const save = async (data: ConfigMap) => {
    setSaving(true)
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success('Configuración actualizada')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }
  return { save, saving }
}

// ── Configuraciones ───────────────────────────────────────────────────────────
function ConfiguracionesSection({ config }: { config: ConfigMap }) {
  const { save, saving } = useSave()
  const [mostrarStock, setMostrarStock] = useState(config['prod.mostrarStock'] ?? 'soloClientes')
  const [mostrarPrecios, setMostrarPrecios] = useState(config['prod.mostrarPrecios'] ?? 'soloClientes')
  const [enmascararProveedor, setEnmascararProveedor] = useState(
    config['prod.enmascararProveedor'] !== 'false',
  )
  const [enmascararPropios, setEnmascararPropios] = useState(
    config['prod.enmascararPropios'] === 'true',
  )

  const opts = [
    { value: 'todos', label: 'Todos' },
    { value: 'soloClientes', label: 'Solo a clientes' },
    { value: 'ninguno', label: 'Ninguno' },
  ]

  const SelectField = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: string
    onChange: (v: string) => void
  }) => (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        <span className="text-muted-foreground">123</span> {label}
      </Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Mostrar Stock" value={mostrarStock} onChange={setMostrarStock} />
        <SelectField label="Mostrar Precios" value={mostrarPrecios} onChange={setMostrarPrecios} />
      </div>
      <Separator />
      <div className="space-y-2">
        <p className="font-medium">Enmascarar códigos</p>
        <p className="text-xs text-muted-foreground">
          Si se activa, el código original del proveedor no será visible para los clientes.
        </p>
        <div className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <Label>De proveedor</Label>
            <Switch checked={enmascararProveedor} onCheckedChange={setEnmascararProveedor} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Productos propios</Label>
            <Switch checked={enmascararPropios} onCheckedChange={setEnmascararPropios} />
          </div>
        </div>
      </div>
      <Button
        disabled={saving}
        onClick={() =>
          save({
            'prod.mostrarStock': mostrarStock,
            'prod.mostrarPrecios': mostrarPrecios,
            'prod.enmascararProveedor': String(enmascararProveedor),
            'prod.enmascararPropios': String(enmascararPropios),
          })
        }
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Diseño carrusel ───────────────────────────────────────────────────────────
function CarruselSection({ config }: { config: ConfigMap }) {
  const { save, saving } = useSave()
  const [estilo, setEstilo] = useState(config['prod.carrusel.estilo'] ?? 'Clasico')
  const [movil, setMovil] = useState(Number(config['prod.carrusel.movil'] ?? 1))
  const [tablet, setTablet] = useState(Number(config['prod.carrusel.tablet'] ?? 2))
  const [escritorio, setEscritorio] = useState(Number(config['prod.carrusel.escritorio'] ?? 3))
  const [flechas, setFlechas] = useState(config['prod.carrusel.flechas'] === 'true')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Estilo</Label>
        <select
          value={estilo}
          onChange={(e) => setEstilo(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {['Clasico', 'Moderno', 'Minimalista'].map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <Separator />

      <div className="space-y-4">
        <p className="font-medium text-sm">Productos en pantalla</p>

        {[
          { label: 'Móvil', icon: '📱', value: movil, set: setMovil, max: 3 },
          { label: 'Tablet', icon: '📋', value: tablet, set: setTablet, max: 5 },
          { label: 'Escritorio', icon: '🖥️', value: escritorio, set: setEscritorio, max: 8 },
        ].map(({ label, icon, value, set, max }) => (
          <div key={label} className="flex items-center gap-4">
            <span className="w-28 text-sm flex items-center gap-1.5">
              <span>{icon}</span> {label}:
            </span>
            <Slider
              min={1}
              max={max}
              step={1}
              value={[value]}
              onValueChange={([v]) => set(v)}
              className="flex-1"
            />
            <span className="w-16 text-right text-sm font-medium">{value} Item{value !== 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-sm">↔</span>
          <Label>Mostrar flechas</Label>
        </div>
        <Switch checked={flechas} onCheckedChange={setFlechas} />
      </div>

      <Button
        disabled={saving}
        onClick={() =>
          save({
            'prod.carrusel.estilo': estilo,
            'prod.carrusel.movil': String(movil),
            'prod.carrusel.tablet': String(tablet),
            'prod.carrusel.escritorio': String(escritorio),
            'prod.carrusel.flechas': String(flechas),
          })
        }
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Diseño de vista previa ────────────────────────────────────────────────────
const ESTILOS_VISTA = ['Clasico', 'Minimalista', 'Compacto', 'Sencillo', 'Personalizado']

function VistaPreviaSection({ config }: { config: ConfigMap }) {
  const { save, saving } = useSave()
  const [estilo, setEstilo] = useState(config['prod.vistaPrevia.estilo'] ?? 'Minimalista')

  return (
    <div className="space-y-6">
      <div>
        <p className="font-medium mb-3">Estilo</p>
        <RadioGroup value={estilo} onValueChange={setEstilo} className="gap-3">
          {ESTILOS_VISTA.map((e) => (
            <div key={e} className="flex items-center gap-2">
              <RadioGroupItem value={e} id={`estilo-${e}`} />
              <Label htmlFor={`estilo-${e}`} className="cursor-pointer font-normal">
                {e}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <Button disabled={saving} onClick={() => save({ 'prod.vistaPrevia.estilo': estilo })}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Vista detalle ─────────────────────────────────────────────────────────────
function VistaDetalleSection({ config }: { config: ConfigMap }) {
  const { save, saving } = useSave()
  const [nota, setNota] = useState(config['prod.vistaDetalle.nota'] ?? '')

  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium text-primary">Nota</p>
        <p className="text-sm text-muted-foreground">
          Texto informativo que aparece en la vista detalle de cada producto
        </p>
      </div>
      <Textarea
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        rows={5}
        placeholder="*Los precios son de carácter informativo..."
      />
      <Button disabled={saving} onClick={() => save({ 'prod.vistaDetalle.nota': nota })}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Colección destacada ───────────────────────────────────────────────────────
function ColeccionDestacadaSection({ config }: { config: ConfigMap }) {
  const { save, saving } = useSave()
  const [activo, setActivo] = useState(config['prod.coleccionDestacada.activo'] === 'true')

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Al activar se reemplazarán los productos del mes en la página de inicio por la colección
        seleccionada.
      </p>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <Label>Activar</Label>
        <Switch checked={activo} onCheckedChange={setActivo} />
      </div>
      <Button
        disabled={saving}
        onClick={() => save({ 'prod.coleccionDestacada.activo': String(activo) })}
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}
