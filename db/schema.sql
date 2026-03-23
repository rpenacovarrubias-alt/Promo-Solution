-- =============================================================
-- my-promoprice — PostgreSQL Schema
-- Proyecto: Promo Solution
-- =============================================================

-- Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id            SERIAL PRIMARY KEY,
  codigo        VARCHAR(20) UNIQUE NOT NULL,  -- 'forpromotional','promooption','doblevela','innovation','manual'
  nombre        VARCHAR(100) NOT NULL,
  api_url       TEXT,
  activo        BOOLEAN DEFAULT TRUE,
  sync_interval INTEGER DEFAULT 60,           -- minutos entre sincronizaciones
  ultimo_sync   TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO proveedores (codigo, nombre, api_url, activo) VALUES
  ('forpromotional', '4 For Promotional',   'https://www.forpromotional.com.mx/api', TRUE),
  ('promooption',    'Promo Opción',          'https://promocionalesenlinea.net/docs/info/auth/', TRUE),
  ('doblevela',      'Doble Vela',            NULL, TRUE),
  ('innovation',     'Innovation',            'https://api.innovation.com.mx', TRUE),
  ('manual',         'PROMO SOLUTION',        NULL, TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- Categorías
CREATE TABLE IF NOT EXISTS categorias (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) UNIQUE NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  activa      BOOLEAN DEFAULT TRUE
);

-- Productos (catálogo unificado de todos los proveedores)
CREATE TABLE IF NOT EXISTS productos (
  id                SERIAL PRIMARY KEY,
  proveedor_id      INTEGER REFERENCES proveedores(id),
  codigo_proveedor  VARCHAR(100) NOT NULL,   -- código original del proveedor (ej: BAR-039)
  codigo_prm        VARCHAR(100),            -- código PRM asignado por Promo Solution
  nombre            VARCHAR(300) NOT NULL,
  descripcion       TEXT,
  categoria_id      INTEGER REFERENCES categorias(id),
  categoria_nombre  VARCHAR(100),            -- denormalizado para velocidad
  precio_costo      NUMERIC(12,2),           -- precio del proveedor
  precio_venta      NUMERIC(12,2),           -- precio al cliente (con margen)
  margen_porcentaje NUMERIC(5,2) DEFAULT 40, -- % de margen aplicado
  moneda            VARCHAR(3) DEFAULT 'MXN',
  colores           TEXT[],                  -- array de colores disponibles
  materiales        TEXT,
  medidas           VARCHAR(200),
  peso              VARCHAR(50),
  tecnica_impresion TEXT[],                  -- técnicas de decorado disponibles
  area_impresion    VARCHAR(200),
  cantidad_minima   INTEGER DEFAULT 1,
  tiempo_entrega    VARCHAR(100),
  imagen_principal  TEXT,                    -- URL CloudFront o ruta relativa
  imagenes          TEXT[],                  -- URLs adicionales
  ficha_tecnica_url TEXT,                    -- PDF de ficha técnica si existe
  disponible        BOOLEAN DEFAULT TRUE,
  stock             INTEGER,
  visible_web       BOOLEAN DEFAULT TRUE,
  destacado         BOOLEAN DEFAULT FALSE,
  tags              TEXT[],
  metadata          JSONB,                   -- datos extra del proveedor
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proveedor_id, codigo_proveedor)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_productos_visible ON productos(visible_web, disponible);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_proveedor ON productos(codigo_proveedor);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(200) NOT NULL,
  empresa     VARCHAR(200),
  email       VARCHAR(200),
  telefono    VARCHAR(30),
  whatsapp    VARCHAR(30),
  telegram_id BIGINT,                        -- ID de Telegram para Julio
  descuento   NUMERIC(5,2) DEFAULT 0,        -- % de descuento especial
  notas       TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
  id              SERIAL PRIMARY KEY,
  folio           VARCHAR(20) UNIQUE NOT NULL,  -- COT-2024-0001
  cliente_id      INTEGER REFERENCES clientes(id),
  cliente_nombre  VARCHAR(200),                 -- denormalizado por si no es cliente registrado
  cliente_email   VARCHAR(200),
  cliente_empresa VARCHAR(200),
  canal           VARCHAR(20) DEFAULT 'web',    -- 'web','telegram','whatsapp','manual'
  subtotal        NUMERIC(12,2) DEFAULT 0,
  descuento_monto NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) DEFAULT 0,
  notas           TEXT,
  estatus         VARCHAR(30) DEFAULT 'borrador', -- 'borrador','enviada','vista','aceptada','rechazada'
  pdf_url         TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items de cotización
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id               SERIAL PRIMARY KEY,
  cotizacion_id    INTEGER REFERENCES cotizaciones(id) ON DELETE CASCADE,
  producto_id      INTEGER REFERENCES productos(id),
  codigo_proveedor VARCHAR(100),
  nombre_producto  VARCHAR(300),
  color            VARCHAR(100),
  tecnica          VARCHAR(100),
  cantidad         INTEGER NOT NULL,
  precio_unitario  NUMERIC(12,2) NOT NULL,
  subtotal         NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  notas            TEXT
);

-- Log de sincronizaciones con proveedores
CREATE TABLE IF NOT EXISTS sync_log (
  id               SERIAL PRIMARY KEY,
  proveedor_id     INTEGER REFERENCES proveedores(id),
  iniciado_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completado_at    TIMESTAMP WITH TIME ZONE,
  productos_nuevos INTEGER DEFAULT 0,
  productos_actualizados INTEGER DEFAULT 0,
  productos_sin_cambio   INTEGER DEFAULT 0,
  errores          INTEGER DEFAULT 0,
  detalle          JSONB,
  estatus          VARCHAR(20) DEFAULT 'running'  -- 'running','success','error'
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_productos
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_cotizaciones
  BEFORE UPDATE ON cotizaciones
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Vista para la API de Julio y el sitio web
CREATE OR REPLACE VIEW v_productos_activos AS
SELECT
  p.id,
  p.codigo_proveedor,
  p.codigo_prm,
  p.nombre,
  p.descripcion,
  p.categoria_nombre,
  p.precio_venta,
  p.moneda,
  p.colores,
  p.tecnica_impresion,
  p.medidas,
  p.cantidad_minima,
  p.tiempo_entrega,
  p.imagen_principal,
  p.imagenes,
  p.disponible,
  p.stock,
  p.destacado,
  p.tags,
  pr.nombre AS proveedor_nombre,
  pr.codigo AS proveedor_codigo
FROM productos p
JOIN proveedores pr ON pr.id = p.proveedor_id
WHERE p.visible_web = TRUE
  AND p.disponible = TRUE;
