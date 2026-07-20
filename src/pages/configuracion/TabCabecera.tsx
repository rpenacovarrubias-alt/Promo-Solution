import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, Plus, X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import SectionPanel from './SectionPanel'

const SECTIONS = [
  { key: 'menu', label: 'Menú' },
  { key: 'mensajeSuperior', label: 'Mensaje superior' },
  { key: 'apariencia', label: 'Apariencia' },
]

const PAGES_AVAILABLE = ['Inicio', 'Contacto', 'Nosotros', 'Categorías', 'Colecciones']

type ConfigMap = Record<string, string>

interface MenuItem {
  id: string
  label: string
  type: 'page' | 'custom'
  url?: string
}

interface Props {
  config: ConfigMap
  activeMenu: string
  onMenuChange: (key: string) => void
}

export default function TabCabecera({ config, activeMenu, onMenuChange }: Props) {
  return (
    <SectionPanel items={SECTIONS} activeKey={activeMenu} onSelect={onMenuChange}>
      {activeMenu === 'menu' && <MenuSection config={config} />}
      {activeMenu === 'mensajeSuperior' && <MensajeSuperiorSection config={config} />}
      {activeMenu === 'apariencia' && <AparienciaSection config={config} />}
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

// ── Menú ──────────────────────────────────────────────────────────────────────
function MenuSection({ config }: { config: ConfigMap }) {
  const { save, saving } = useSave()

  const parseMenu = (): MenuItem[] => {
    try {
      return JSON.parse(config['header.menu'] ?? '[]')
    } catch {
      return []
    }
  }

  const [menu, setMenu] = useState<MenuItem[]>(parseMenu)
  const [customLabel, setCustomLabel] = useState('')
  const [customUrl, setCustomUrl] = useState('')

  const addPage = (page: string) => {
    if (menu.find((m) => m.label === page)) return
    setMenu((prev) => [...prev, { id: crypto.randomUUID(), label: page, type: 'page' }])
  }

  const addCustom = () => {
    if (!customLabel.trim()) return
    setMenu((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: customLabel.trim(), type: 'custom', url: customUrl.trim() },
    ])
    setCustomLabel('')
    setCustomUrl('')
  }

  const remove = (id: string) => setMenu((prev) => prev.filter((m) => m.id !== id))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Opciones */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Opciones</p>
          <p className="text-xs font-medium">Páginas</p>
          <div className="space-y-1">
            {PAGES_AVAILABLE.map((page) => (
              <button
                key={page}
                onClick={() => addPage(page)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                {page}
              </button>
            ))}
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium">Link personalizado</p>
            <Input
              placeholder="Etiqueta"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              placeholder="https://..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="h-8 text-sm"
            />
            <Button size="sm" variant="outline" onClick={addCustom} className="w-full">
              <Plus className="mr-1 h-3 w-3" /> Agregar
            </Button>
          </div>
        </div>

        {/* Menú activo */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Menú</p>
          <p className="text-xs text-muted-foreground">Arrastra y suelta para cambiar el orden</p>
          {menu.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin elementos</p>
          ) : (
            <div className="space-y-1">
              {menu.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded border px-3 py-2 text-sm bg-background"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.type === 'page' ? 'Página' : 'Link personalizado'}</p>
                  </div>
                  <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        disabled={saving}
        onClick={() => save({ 'header.menu': JSON.stringify(menu) })}
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Mensaje superior ──────────────────────────────────────────────────────────
function MensajeSuperiorSection({ config }: { config: ConfigMap }) {
  const { save, saving } = useSave()
  const [visible, setVisible] = useState(config['header.msgSuperior.visible'] !== 'false')
  const [animacion, setAnimacion] = useState(config['header.msgSuperior.animacion'] === 'true')
  const [colorFondo, setColorFondo] = useState(config['header.msgSuperior.colorFondo'] ?? '#000000')
  const [colorTexto, setColorTexto] = useState(config['header.msgSuperior.colorTexto'] ?? '#ffffff')
  const [tamanoFuente, setTamanoFuente] = useState(
    Number(config['header.msgSuperior.tamanoFuente'] ?? 14),
  )
  const [altura, setAltura] = useState(Number(config['header.msgSuperior.altura'] ?? 40))
  const [texto, setTexto] = useState(config['header.msgSuperior.texto'] ?? '')
  const [espaciado, setEspaciado] = useState(Number(config['header.msgSuperior.espaciado'] ?? 50))
  const [velocidad, setVelocidad] = useState(Number(config['header.msgSuperior.velocidad'] ?? 50))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm">👁 Visible</span>
          <Switch checked={visible} onCheckedChange={setVisible} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm">▶ Animación</span>
          <Switch checked={animacion} onCheckedChange={setAnimacion} />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm font-medium">Colores</p>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorFondo}
              onChange={(e) => setColorFondo(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border p-0.5"
            />
            <Label>Fondo</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorTexto}
              onChange={(e) => setColorTexto(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border p-0.5"
            />
            <Label>Texto</Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>T Tamaño de fuente</Label>
          <Input
            type="number"
            min={10}
            max={24}
            value={tamanoFuente}
            onChange={(e) => setTamanoFuente(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>≡ Altura</Label>
          <Slider
            min={20}
            max={80}
            step={1}
            value={[altura]}
            onValueChange={([v]) => setAltura(v)}
          />
          <p className="text-xs text-right text-muted-foreground">{altura}px</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Texto</Label>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
          placeholder="Tu Marca en mano de todos"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>↔ Espaciado</Label>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[espaciado]}
            onValueChange={([v]) => setEspaciado(v)}
          />
          <p className="text-xs text-right text-muted-foreground">{espaciado}</p>
        </div>
        <div className="space-y-2">
          <Label>⚡ Velocidad</Label>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[velocidad]}
            onValueChange={([v]) => setVelocidad(v)}
          />
          <p className="text-xs text-right text-muted-foreground">{velocidad}</p>
        </div>
      </div>

      <Separator />

      {/* Vista previa */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Vista previa</p>
        <div
          className="w-full rounded flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: colorFondo,
            height: `${altura}px`,
            fontSize: `${tamanoFuente}px`,
            color: colorTexto,
          }}
        >
          {animacion ? (
            <div className="whitespace-nowrap overflow-hidden">
              <span
                style={{
                  display: 'inline-block',
                  animation: `marquee ${Math.max(1, 10 - velocidad / 15)}s linear infinite`,
                }}
              >
                {texto || 'Tu Marca en mano de todos'}
              </span>
            </div>
          ) : (
            <span>{texto || 'Tu Marca en mano de todos'}</span>
          )}
        </div>
      </div>

      <Button
        disabled={saving}
        onClick={() =>
          save({
            'header.msgSuperior.visible': String(visible),
            'header.msgSuperior.animacion': String(animacion),
            'header.msgSuperior.colorFondo': colorFondo,
            'header.msgSuperior.colorTexto': colorTexto,
            'header.msgSuperior.tamanoFuente': String(tamanoFuente),
            'header.msgSuperior.altura': String(altura),
            'header.msgSuperior.texto': texto,
            'header.msgSuperior.espaciado': String(espaciado),
            'header.msgSuperior.velocidad': String(velocidad),
          })
        }
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Apariencia ────────────────────────────────────────────────────────────────
function AparienciaSection({ config }: { config: ConfigMap }) {
  const { save, saving } = useSave()
  const [colorFondo, setColorFondo] = useState(config['header.apariencia.colorFondo'] ?? '#ffffff')
  const [estilo, setEstilo] = useState(config['header.apariencia.estilo'] ?? 'Sencillo')

  return (
    <div className="space-y-6">
      <div>
        <p className="font-semibold">Apariencia de la cabecera</p>
        <p className="text-sm text-muted-foreground">Estilo y colores del menú principal</p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={colorFondo}
            onChange={(e) => setColorFondo(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded border p-0.5"
          />
          <div>
            <Label>Color de fondo</Label>
            <Input
              value={colorFondo}
              onChange={(e) => setColorFondo(e.target.value)}
              className="mt-1 font-mono text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Estilo</Label>
          <select
            value={estilo}
            onChange={(e) => setEstilo(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {['Sencillo', 'Moderno', 'Transparente'].map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>
      <Button
        disabled={saving}
        onClick={() =>
          save({ 'header.apariencia.colorFondo': colorFondo, 'header.apariencia.estilo': estilo })
        }
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}
