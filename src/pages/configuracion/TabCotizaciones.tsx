import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import SectionPanel from './SectionPanel'

const SECTIONS = [
  { key: 'general', label: 'General' },
]

type ConfigMap = Record<string, string>

interface Props {
  config: ConfigMap
  activeMenu: string
  onMenuChange: (key: string) => void
}

export default function TabCotizaciones({ config, activeMenu, onMenuChange }: Props) {
  return (
    <SectionPanel items={SECTIONS} activeKey={activeMenu} onSelect={onMenuChange}>
      {activeMenu === 'general' && <GeneralSection config={config} />}
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

// ── General ───────────────────────────────────────────────────────────────────
function GeneralSection({ config }: { config: ConfigMap }) {
  const { save, saving } = useSave()
  const [invitado, setInvitado] = useState(config['cot.invitado'] === 'true')
  const [tecnica, setTecnica] = useState(config['cot.tecnicaImpresion'] !== 'false')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="font-semibold text-primary">Cotizaciones como invitado</p>
        <p className="text-sm text-muted-foreground">
          Permite que los visitantes envíen cotizaciones sin necesidad de registrarse.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Switch checked={invitado} onCheckedChange={setInvitado} />
          <Label>Activar</Label>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="font-semibold text-primary">Técnica de impresión</p>
        <p className="text-sm text-muted-foreground">
          Si se desactiva, no se mostrarán precios de las impresiones en las cotizaciones del sitio web.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Switch checked={tecnica} onCheckedChange={setTecnica} />
          <Label>Desglosar</Label>
        </div>
      </div>

      <Button
        disabled={saving}
        onClick={() =>
          save({ 'cot.invitado': String(invitado), 'cot.tecnicaImpresion': String(tecnica) })
        }
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Actualizar
      </Button>
    </div>
  )
}
