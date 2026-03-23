# my-promoprice

Sistema web propio para **Promo Solutions** que reemplaza MyCavi.
Repo: `rpenacovarrubias-alt/Promo-Solution`

## Stack

- **Next.js 14** (App Router) — sitio web + API
- **PostgreSQL** — catálogo unificado (mismo servidor que n8n)
- **Tailwind CSS** — estilos con branding navy/gold
- **Docker** — deploy en EasyPanel

## Estructura

```
my-promoprice/
├── web/                 # Next.js — promosolution.com.mx
│   ├── app/
│   │   ├── page.tsx            # Home
│   │   ├── catalogo/page.tsx   # Catálogo con filtros
│   │   ├── producto/[slug]/    # Ficha técnica
│   │   ├── cotizar/page.tsx    # Carrito de cotización
│   │   └── api/
│   │       ├── products/       # GET búsqueda (Julio + web)
│   │       └── quotes/         # POST cotización
│   ├── components/
│   │   ├── layout/Header Footer
│   │   ├── product/ProductoCard AddToCartButton
│   │   └── quote/CarritoContext
│   └── lib/
│       ├── db.ts               # Conexión PostgreSQL
│       └── productos.ts        # Tipos + helpers
├── db/
│   └── schema.sql              # Schema completo PostgreSQL
├── sync/
│   ├── innovation.ts           # Sync API Innovation
│   └── forpromotional.ts       # Sync API 4 For Promotional
├── .env.example                # Variables de entorno (llenar y renombrar a .env.local)
├── Dockerfile.web              # Docker para EasyPanel
└── docker-compose.yml          # Para desarrollo local
```

## Setup inicial

### 1. Clonar y configurar

```bash
git clone https://github.com/rpenacovarrubias-alt/Promo-Solution.git
cd Promo-Solution
cp .env.example .env.local
# Editar .env.local con tus credenciales reales
```

### 2. Crear la base de datos

```bash
# Conectado a tu PostgreSQL de EasyPanel:
psql -U postgres -d promosolution -f db/schema.sql
```

### 3. Desarrollo local

```bash
cd web
npm install
npm run dev
# Sitio en http://localhost:3000
```

### 4. Deploy en EasyPanel

```bash
# En EasyPanel, crear nuevo servicio tipo "App"
# Image: ghcr.io/rpenacovarrubias-alt/promo-solution/web:latest
# Variables de entorno: copiar de .env.example y llenar valores reales
# Puerto: 3000
# Dominio: promosolution.com.mx
```

## API para Julio (n8n)

### Buscar productos

```
GET /api/products?q=termo&categoria=Bebidas&limit=10
```

Respuesta:
```json
{
  "productos": [...],
  "total": 42,
  "hasMore": true
}
```

### Crear cotización

```
POST /api/quotes
Content-Type: application/json

{
  "cliente_nombre": "Juan Pérez",
  "cliente_email": "juan@empresa.com",
  "canal": "telegram",
  "items": [
    { "producto_id": 123, "cantidad": 50, "color": "Azul" }
  ]
}
```

## Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `INNOVATION_API_KEY` | API key de Innovation |
| `FORPROMOTIONAL_USER` | Email cuenta For Promotional |
| `FORPROMOTIONAL_PASS` | Contraseña For Promotional |
| `JULIO_API_KEY` | Clave para autenticar llamadas de Julio |

Ver `.env.example` para la lista completa.
