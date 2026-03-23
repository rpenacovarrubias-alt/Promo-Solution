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
}

const navGroups: NavGroup[] = [
  {
    title: 'Principal',
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    title: 'Catálogo',
    items: [
      { to: '/proveedores', icon: Truck, label: 'Proveedores' },
      { to: '/catalogos', icon: BookOpen, label: 'Catálogos' },
      { to: '/productos', icon: Package, label: 'Productos' },
      { to: '/servicios', icon: Scissors, label: 'Servicios' },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { to: '/clientes', icon: Users, label: 'Clientes' },
      { to: '/cotizaciones', icon: FileText, label: 'Cotizaciones' },
    ],
  },
  {
    title: 'Sistema',
    items: [{ to: '/configuracion', icon: Settings, label: 'Configuración' }],
  },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Tag className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide">PROMO</p>
          <p className="text-xs font-semibold text-muted-foreground tracking-widest">SOLUTION</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-1 px-6 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.title}
            </p>
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
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
