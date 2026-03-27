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
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
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
    ],
  },
  {
    title: 'Catálogo',
    collapsible: true,
    defaultOpen: true,
    items: [
      { to: '/proveedores', icon: Truck, label: 'Proveedores' },
      { to: '/catalogos', icon: BookOpen, label: 'Catálogos' },
      { to: '/categorias', icon: Tag, label: 'Categorías' },
      { to: '/colecciones', icon: FolderOpen, label: 'Colecciones' },
      { to: '/productos', icon: Package, label: 'Productos' },
      { to: '/servicios', icon: Scissors, label: 'Servicios' },
    ],
  },
  {
    title: 'Ventas',
    collapsible: true,
    defaultOpen: true,
    items: [
      { to: '/clientes', icon: Users, label: 'Clientes' },
      { to: '/cotizaciones', icon: FileText, label: 'Cotizaciones' },
    ],
  },
  {
    title: 'Sistema',
    collapsible: true,
    defaultOpen: false,
    items: [
      { to: '/usuarios', icon: UserCog, label: 'Usuarios' },
      { to: '/configuracion', icon: Settings, label: 'Configuración' },
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
  const [open, setOpen] = useState(group.defaultOpen ?? !group.collapsible || isAnyActive)

  return (
    <div className="mb-1">
      {group.collapsible ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between px-6 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          {group.title}
          <ChevronDown
            className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
          />
        </button>
      ) : (
        <p className="mb-1 px-6 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {group.title}
        </p>
      )}

      {open && (
        <div>
          {group.items.map(({ to, icon: Icon, label }) => {
            const isActive =
              to === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
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
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Globe className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide">PROMO</p>
          <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
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
      <div className="border-t px-5 py-3">
        <p className="text-[10px] text-muted-foreground">v1.0.0 · Promo Solution</p>
      </div>
    </aside>
  )
}
