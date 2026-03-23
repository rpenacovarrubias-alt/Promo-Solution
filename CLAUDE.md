# CLAUDE.md — Promo-Solution

Panel de administración para empresa de productos promocionales.

---

## Stack

- **Frontend:** React 18 + TypeScript + Vite 5
- **Estilos:** Tailwind CSS v3 + shadcn/ui (Radix UI)
- **Routing:** React Router DOM v6 (rutas en español)
- **Formularios:** React Hook Form + Zod
- **Toasts:** Sonner (`import { toast } from 'sonner'` — NO useToast)
- **Iconos:** Lucide React
- **ORM:** Prisma + PostgreSQL
- **API:** Vercel Serverless Functions en `/api/`
- **Deploy:** Vercel

## Comandos

```bash
npm install        # instala dependencias + genera cliente Prisma
npm run dev        # servidor de desarrollo
npm run build      # build de producción (tsc + vite)
npx prisma generate    # genera Prisma Client
npx prisma db push     # sincroniza schema con la BD
npx prisma studio      # UI de base de datos
```

## Variables de entorno

```
POSTGRES_URL=postgresql://user:pass@host:5432/dbname
```

## Estructura

```
src/
  main.tsx            # entry point
  App.tsx             # rutas (todas lazy-loaded)
  index.css           # Tailwind + CSS variables shadcn
  pages/              # Login, Dashboard, Proveedores, Catalogos,
                      # Productos, Servicios, Clientes, Cotizaciones, Configuracion
  components/
    layout/           # MainLayout, Sidebar, Header
    auth/             # ProtectedRoute
    ui/               # shadcn/ui components
  contexts/           # AuthContext (mock auth)
  hooks/              # useAuth
  lib/                # utils (cn, formatCurrency, formatDate, truncate)
api/                  # Vercel Serverless Functions
prisma/
  schema.prisma       # modelos: User, Provider, Product, Service, Client, Quote, QuoteItem
```

## Convenciones

- Alias `@/` → `src/`
- Todas las páginas lazy-loaded con `React.lazy()`
- Toast: `import { toast } from 'sonner'`
- API: CORS headers en todas las rutas de `/api/`
- Auth: mock — cualquier email/password inicia sesión como ADMIN
