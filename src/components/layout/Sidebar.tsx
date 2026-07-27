import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  BookOpen,
  Package,
  Scissors,
  Users,
  FileText,
  Settings,
  Tag,
  FolderOpen,
  ChevronDown,
  UserCog,
  FileStack,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SITIO_PUBLICO_URL = 'https://promosolution-web.vercel.app'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  external?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

const navGroups: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: SITIO_PUBLICO_URL, icon: ExternalLink, label: 'Sitio Público', external: true },
    ],
  },
  {
    title: 'Catálogo',
    collapsible: true,
    defaultOpen: true,
    items: [
      { to: '/proveedores',  icon: Truck,       label: 'Proveedores' },
      { to: '/catalogos',    icon: BookOpen,    label: 'Catálogos' },
      { to: '/categorias',   icon: Tag,         label: 'Categorías' },
      { to: '/colecciones',  icon: FolderOpen,  label: 'Colecciones' },
      { to: '/productos',    icon: Package,     label: 'Productos' },
      { to: '/servicios',    icon: Scissors,    label: 'Servicios' },
    ],
  },
  {
    title: 'Ventas',
    collapsible: true,
    defaultOpen: true,
    items: [
      { to: '/clientes',     icon: Users,    label: 'Clientes' },
      { to: '/cotizaciones', icon: FileText, label: 'Cotizaciones' },
    ],
  },
  {
    title: 'Preferencias',
    collapsible: true,
    defaultOpen: false,
    items: [
      { to: '/configuracion', icon: Settings,   label: 'Configuración' },
      { to: '/paginas',       icon: FileStack,  label: 'Páginas' },
    ],
  },
  {
    title: 'Administrador',
    collapsible: true,
    defaultOpen: false,
    items: [
      { to: '/usuarios', icon: UserCog, label: 'Usuarios' },
    ],
  },
]

function NavGroup({ group }: { group: NavGroup }) {
  const location = useLocation()
  const isAnyActive = group.items.some((item) =>
    item.to === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(item.to),
  )
  const [open, setOpen] = useState(group.defaultOpen ?? (!group.collapsible || isAnyActive))

  return (
    <div className="mb-1">
      {group.collapsible ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between px-6 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          {group.title}
          <ChevronDown
            className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
          />
        </button>
      ) : (
        <p className="mb-1 px-6 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          {group.title}
        </p>
      )}

      {open && (
        <div className="space-y-1 px-3">
          {group.items.map(({ to, icon: Icon, label, external }) => {
            if (external) {
              return (
                <a
                  key={to}
                  href={to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 transition-colors duration-150 hover:bg-white/[0.06]"
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {label}
                </a>
              )
            }
            const isActive =
              to === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-white/[0.07] text-white'
                    : 'text-white/75 hover:bg-white/[0.06]',
                )}
              >
                <span
                  className={cn(
                    'absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-gold transition-transform duration-200 ease-out',
                    isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0',
                  )}
                />
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {label}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col bg-navy">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.08] px-5">
        <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
          <path d="M6 3h13a8 8 0 0 1 0 16h-8v8H6V3z" fill="white" />
          <path d="M11 8h7a3.5 3.5 0 0 1 0 7h-7V8z" fill="#17264A" />
        </svg>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide text-white">PROMO</p>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-gold uppercase">
            Solution
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navGroups.map((group) => (
          <NavGroup key={group.title} group={group} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.08] px-6 py-3">
        <p className="text-[10px] text-white/35">v1.0.0 · Promo Solution</p>
      </div>
    </aside>
  )
}
