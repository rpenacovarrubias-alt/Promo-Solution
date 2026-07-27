import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import SectionPanel from './SectionPanel'

const SECTIONS = [
  { key: 'notificaciones', label: 'Notificaciones' },
  { key: 'logotipos', label: 'Logotipos' },
  { key: 'seo', label: 'SEO' },
  { key: 'colores', label: 'Colores y botones' },
  { key: 'tipografia', label: 'Tipografía' },
  { key: 'buscador', label: 'Buscador' },
  { key: 'carrito', label: 'Carrito' },
]

type ConfigMap = Record<string, string>

interface Props {
  config: ConfigMap
  activeMenu: string
  onMenuChange: (key: string) => void
}

export default function TabGenerales({ config, activeMenu, onMenuChange }: Props) {
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

  const SaveButton = () => (
    <div className="mt-6">
      <Button disabled={saving} onClick={() => {}}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )

  return (
    <SectionPanel items={SECTIONS} activeKey={activeMenu} onSelect={onMenuChange}>
      {activeMenu === 'notificaciones' && (
        <NotificacionesSection config={config} save={save} saving={saving} />
      )}
      {activeMenu === 'logotipos' && (
        <LogotiposSection config={config} save={save} saving={saving} />
      )}
      {activeMenu === 'seo' && (
        <SeoSection config={config} save={save} saving={saving} />
      )}
      {activeMenu === 'colores' && (
        <ColoresSection config={config} save={save} saving={saving} />
      )}
      {activeMenu === 'tipografia' && (
        <TipografiaSection config={config} save={save} saving={saving} />
      )}
      {activeMenu === 'buscador' && (
        <BuscadorSection config={config} save={save} saving={saving} />
      )}
      {activeMenu === 'carrito' && (
        <CarritoSection config={config} save={save} saving={saving} />
      )}
    </SectionPanel>
  )
}

// ── Notificaciones ────────────────────────────────────────────────────────────
function NotificacionesSection({
  config,
  save,
  saving,
}: {
  config: ConfigMap
  save: (d: ConfigMap) => void
  saving: boolean
}) {
  const [email, setEmail] = useState(config['notif.email'] ?? '')
  const [whatsapp, setWhatsapp] = useState(config['notif.whatsapp'] === 'true')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Notificaciones por correo</h3>
        <p className="text-sm text-muted-foreground">
          Formularios de cotización, cliente nuevo y contacto en el sitio.
        </p>
      </div>
      <div className="space-y-2">
        <Input
          placeholder="ventas@promosolution.com.mx"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Separar con comas (,)</p>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <Label>Cotizaciones por WhatsApp</Label>
        <Switch checked={whatsapp} onCheckedChange={setWhatsapp} />
      </div>
      <Button
        disabled={saving}
        onClick={() => save({ 'notif.email': email, 'notif.whatsapp': String(whatsapp) })}
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Logotipos ─────────────────────────────────────────────────────────────────
function LogotiposSection({
  config,
  save,
  saving,
}: {
  config: ConfigMap
  save: (d: ConfigMap) => void
  saving: boolean
}) {
  const [principal, setPrincipal] = useState(config['logos.principal'] ?? '')
  const [secundario, setSecundario] = useState(config['logos.secundario'] ?? '')
  const [favicon, setFavicon] = useState(config['logos.favicon'] ?? '')
  const [usoCorreos, setUsoCorreos] = useState(config['logos.uso.correos'] ?? 'Principal')
  const [usoPdf, setUsoPdf] = useState(config['logos.uso.pdf'] ?? 'Principal')
  const [usoFooter, setUsoFooter] = useState(config['logos.uso.footer'] ?? 'Secundario')

  const USO_ROWS: { label: string; value: string; set: (v: string) => void }[] = [
    { label: 'Correos', value: usoCorreos, set: setUsoCorreos },
    { label: 'PDF', value: usoPdf, set: setUsoPdf },
    { label: 'Pie de página', value: usoFooter, set: setUsoFooter },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Logotipos</h3>
        <p className="text-sm text-muted-foreground">URLs de los logotipos del sitio</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Logo principal (URL)</Label>
          <Input
            type="url"
            placeholder="https://..."
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
          {principal && (
            <img src={principal} alt="Logo principal" className="h-16 object-contain rounded border p-2" />
          )}
        </div>
        <div className="space-y-2">
          <Label>Logo secundario (URL)</Label>
          <Input
            type="url"
            placeholder="https://..."
            value={secundario}
            onChange={(e) => setSecundario(e.target.value)}
          />
          {secundario && (
            <img src={secundario} alt="Logo secundario" className="h-16 object-contain rounded border p-2" />
          )}
        </div>
        <div className="space-y-2">
          <Label>Favicon (URL)</Label>
          <Input
            type="url"
            placeholder="https://..."
            value={favicon}
            onChange={(e) => setFavicon(e.target.value)}
          />
          {favicon && (
            <img src={favicon} alt="Favicon" className="h-8 w-8 object-contain rounded border p-1" />
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold">Logotipo a usar</p>
          <p className="text-xs text-muted-foreground">
            Recomendación: usa el logo secundario para fondos oscuros y el principal para fondos claros.
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2 font-medium">Contexto</th>
                <th className="px-4 py-2 font-medium">Principal</th>
                <th className="px-4 py-2 font-medium">Secundario</th>
              </tr>
            </thead>
            <tbody>
              {USO_ROWS.map((row) => (
                <tr key={row.label} className="border-t">
                  <td className="px-4 py-2.5 font-medium">{row.label}</td>
                  <td className="px-4 py-2.5">
                    <input
                      type="radio"
                      name={`uso-${row.label}`}
                      checked={row.value === 'Principal'}
                      onChange={() => row.set('Principal')}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="radio"
                      name={`uso-${row.label}`}
                      checked={row.value === 'Secundario'}
                      onChange={() => row.set('Secundario')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button
        disabled={saving}
        onClick={() =>
          save({
            'logos.principal': principal,
            'logos.secundario': secundario,
            'logos.favicon': favicon,
            'logos.uso.correos': usoCorreos,
            'logos.uso.pdf': usoPdf,
            'logos.uso.footer': usoFooter,
          })
        }
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── SEO ───────────────────────────────────────────────────────────────────────
function SeoSection({
  config,
  save,
  saving,
}: {
  config: ConfigMap
  save: (d: ConfigMap) => void
  saving: boolean
}) {
  const [title, setTitle] = useState(config['seo.title'] ?? '')
  const [description, setDescription] = useState(config['seo.description'] ?? '')
  const [keywords, setKeywords] = useState(config['seo.keywords'] ?? '')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">SEO</h3>
        <p className="text-sm text-muted-foreground">Metadatos para motores de búsqueda</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Título del sitio</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Descripción</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          <p className="text-xs text-muted-foreground">Recomendado: 150-160 caracteres</p>
        </div>
        <div className="space-y-2">
          <Label>Palabras clave</Label>
          <Input
            placeholder="productos promocionales, artículos, regalos..."
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Separar con comas</p>
        </div>
      </div>
      <Button
        disabled={saving}
        onClick={() =>
          save({ 'seo.title': title, 'seo.description': description, 'seo.keywords': keywords })
        }
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Colores y botones ─────────────────────────────────────────────────────────
function ColoresSection({
  config,
  save,
  saving,
}: {
  config: ConfigMap
  save: (d: ConfigMap) => void
  saving: boolean
}) {
  const [primario, setPrimario] = useState(config['colors.primario'] ?? '#7c3aed')
  const [secundario, setSecundario] = useState(config['colors.secundario'] ?? '#a78bfa')
  const [boton, setBoton] = useState(config['colors.boton'] ?? '#7c3aed')
  const [texto, setTexto] = useState(config['colors.texto'] ?? '#111827')

  const ColorField = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: string
    onChange: (v: string) => void
  }) => (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-10 cursor-pointer rounded border p-0.5"
      />
      <div className="flex-1 space-y-1">
        <Label>{label}</Label>
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-sm" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Colores y botones</h3>
        <p className="text-sm text-muted-foreground">Paleta de colores del sitio web</p>
      </div>
      <div className="space-y-4">
        <ColorField label="Color primario" value={primario} onChange={setPrimario} />
        <ColorField label="Color secundario" value={secundario} onChange={setSecundario} />
        <ColorField label="Color de botones" value={boton} onChange={setBoton} />
        <ColorField label="Color de texto" value={texto} onChange={setTexto} />
      </div>
      <Button
        disabled={saving}
        onClick={() =>
          save({
            'colors.primario': primario,
            'colors.secundario': secundario,
            'colors.boton': boton,
            'colors.texto': texto,
          })
        }
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Tipografía ────────────────────────────────────────────────────────────────
const FUENTES = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito', 'Raleway']

function TipografiaSection({
  config,
  save,
  saving,
}: {
  config: ConfigMap
  save: (d: ConfigMap) => void
  saving: boolean
}) {
  const [fuente, setFuente] = useState(config['tipografia.fuente'] ?? 'Inter')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Tipografía</h3>
        <p className="text-sm text-muted-foreground">Fuente principal del sitio</p>
      </div>
      <div className="space-y-2">
        <Label>Fuente</Label>
        <select
          value={fuente}
          onChange={(e) => setFuente(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {FUENTES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <p className="text-sm mt-3" style={{ fontFamily: fuente }}>
          Así se verá el texto con <strong>{fuente}</strong>: Productos promocionales de calidad.
        </p>
      </div>
      <Button disabled={saving} onClick={() => save({ 'tipografia.fuente': fuente })}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Buscador ──────────────────────────────────────────────────────────────────
function BuscadorSection({
  config,
  save,
  saving,
}: {
  config: ConfigMap
  save: (d: ConfigMap) => void
  saving: boolean
}) {
  const [activo, setActivo] = useState(config['buscador.activo'] !== 'false')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Buscador</h3>
        <p className="text-sm text-muted-foreground">
          Barra de búsqueda visible en el sitio web
        </p>
      </div>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Activar buscador</p>
          <p className="text-sm text-muted-foreground">
            Los visitantes podrán buscar productos por nombre o código
          </p>
        </div>
        <Switch checked={activo} onCheckedChange={setActivo} />
      </div>
      <Button disabled={saving} onClick={() => save({ 'buscador.activo': String(activo) })}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Carrito ───────────────────────────────────────────────────────────────────
function CarritoSection({
  config,
  save,
  saving,
}: {
  config: ConfigMap
  save: (d: ConfigMap) => void
  saving: boolean
}) {
  const [activo, setActivo] = useState(config['carrito.activo'] !== 'false')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Carrito</h3>
        <p className="text-sm text-muted-foreground">
          Carrito de cotización rápida en el sitio web
        </p>
      </div>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Activar carrito</p>
          <p className="text-sm text-muted-foreground">
            Los visitantes podrán agregar productos y enviar una cotización desde el sitio
          </p>
        </div>
        <Switch checked={activo} onCheckedChange={setActivo} />
      </div>
      <Button disabled={saving} onClick={() => save({ 'carrito.activo': String(activo) })}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}
