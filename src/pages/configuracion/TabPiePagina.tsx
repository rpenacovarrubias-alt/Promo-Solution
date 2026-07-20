import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, Plus, X, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import SectionPanel from './SectionPanel'

const SECTIONS = [
  { key: 'menu', label: 'Menú' },
  { key: 'apariencia', label: 'Apariencia' },
  { key: 'redesSociales', label: 'Redes sociales' },
]

const PAGES_AVAILABLE = ['Inicio', 'Contacto', 'Nosotros', 'Categorías', 'Colecciones']

const REDES_OPCIONES = ['WhatsApp', 'Facebook', 'Instagram', 'Twitter', 'YouTube', 'LinkedIn', 'TikTok']

type ConfigMap = Record<string, string>

interface MenuItem {
  id: string
  label: string
  type: 'page' | 'custom'
  url?: string
}

interface RedSocial {
  id: string
  tipo: string
  url: string
}

interface Props {
  config: ConfigMap
  activeMenu: string
  onMenuChange: (key: string) => void
}

export default function TabPiePagina({ config, activeMenu, onMenuChange }: Props) {
  return (
    <SectionPanel items={SECTIONS} activeKey={activeMenu} onSelect={onMenuChange}>
      {activeMenu === 'menu' && <MenuSection config={config} />}
      {activeMenu === 'apariencia' && <AparienciaSection config={config} />}
      {activeMenu === 'redesSociales' && <RedesSocialesSection config={config} />}
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
      return JSON.parse(config['footer.menu'] ?? '[]')
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
                    <p className="text-xs text-muted-foreground">
                      {item.type === 'page' ? 'Página' : 'Link personalizado'}
                    </p>
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

      <Button disabled={saving} onClick={() => save({ 'footer.menu': JSON.stringify(menu) })}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Apariencia ────────────────────────────────────────────────────────────────
function AparienciaSection({ config }: { config: ConfigMap }) {
  const { save, saving } = useSave()
  const [colorFondo, setColorFondo] = useState(config['footer.colorFondo'] ?? '#000000')
  const [colorTexto, setColorTexto] = useState(config['footer.colorTexto'] ?? '#ffffff')
  const [estilo, setEstilo] = useState(config['footer.estilo'] ?? 'Sencillo')
  const [poweredBy, setPoweredBy] = useState(config['footer.poweredBy'] !== 'false')
  const [informacion, setInformacion] = useState(config['footer.informacion'] ?? '')

  return (
    <div className="space-y-5">
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

      <div className="space-y-2">
        <Label>Estilo</Label>
        <select
          value={estilo}
          onChange={(e) => setEstilo(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {['Sencillo', 'Moderno', 'Compacto'].map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Powered by Promo Solution</p>
          <p className="text-sm text-muted-foreground">Mostrar crédito en el pie de página</p>
        </div>
        <Switch checked={poweredBy} onCheckedChange={setPoweredBy} />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Información</Label>
        <Textarea
          value={informacion}
          onChange={(e) => setInformacion(e.target.value)}
          rows={3}
          placeholder="© 2025 Promo Solution. Todos los derechos reservados."
        />
      </div>

      {/* Vista previa */}
      <div
        className="rounded-lg p-4 text-sm flex items-center justify-between"
        style={{ backgroundColor: colorFondo, color: colorTexto }}
      >
        <span className="font-bold">PROMO SOLUTION</span>
        <div className="flex gap-4 text-xs">
          <span>CONTACTO</span>
          <span>NOSOTROS</span>
        </div>
        <div className="flex gap-2 text-xs">
          <span>Instagram</span>
          <span>Facebook</span>
        </div>
      </div>

      <Button
        disabled={saving}
        onClick={() =>
          save({
            'footer.colorFondo': colorFondo,
            'footer.colorTexto': colorTexto,
            'footer.estilo': estilo,
            'footer.poweredBy': String(poweredBy),
            'footer.informacion': informacion,
          })
        }
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}

// ── Redes sociales ────────────────────────────────────────────────────────────
function RedesSocialesSection({ config }: { config: ConfigMap }) {
  const { save, saving } = useSave()

  const parseRedes = (): RedSocial[] => {
    try {
      return JSON.parse(config['footer.redesSociales'] ?? '[]')
    } catch {
      return []
    }
  }

  const [redes, setRedes] = useState<RedSocial[]>(parseRedes)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTipo, setNewTipo] = useState('WhatsApp')
  const [newUrl, setNewUrl] = useState('')
  const [showForm, setShowForm] = useState(false)

  const saveRedes = () => save({ 'footer.redesSociales': JSON.stringify(redes) })

  const addRed = () => {
    if (!newUrl.trim()) return
    if (editingId) {
      setRedes((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, tipo: newTipo, url: newUrl.trim() } : r)),
      )
      setEditingId(null)
    } else {
      setRedes((prev) => [...prev, { id: crypto.randomUUID(), tipo: newTipo, url: newUrl.trim() }])
    }
    setNewUrl('')
    setShowForm(false)
  }

  const editRed = (red: RedSocial) => {
    setEditingId(red.id)
    setNewTipo(red.tipo)
    setNewUrl(red.url)
    setShowForm(true)
  }

  const removeRed = (id: string) => setRedes((prev) => prev.filter((r) => r.id !== id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-primary">Redes sociales</p>
        <Button
          size="sm"
          onClick={() => {
            setEditingId(null)
            setNewTipo('WhatsApp')
            setNewUrl('')
            setShowForm(true)
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> Agregar
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">{editingId ? 'Editar red' : 'Nueva red social'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Red</Label>
              <select
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {REDES_OPCIONES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>URL</Label>
              <Input
                placeholder="https://..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addRed}>
              {editingId ? 'Guardar' : 'Agregar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {redes.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Sin redes sociales configuradas</p>
      ) : (
        <div className="space-y-2">
          {redes.map((red) => (
            <div
              key={red.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="w-28 shrink-0 font-medium text-sm">{red.tipo}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">{red.url}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => editRed(red)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeRed(red.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button disabled={saving} onClick={saveRedes}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}
