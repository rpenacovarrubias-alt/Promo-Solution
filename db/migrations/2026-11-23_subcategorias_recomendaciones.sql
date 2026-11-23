-- Subcategorías (árbol de 2 niveles) y Recomendaciones con productos de cualquier proveedor.
-- Idempotente. Aplicar ANTES de desplegar el código que la usa (staging primero, producción al promover).
-- Equivale a `prisma db push` para estos cambios.

ALTER TABLE promo_panel."Category" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
DO $$ BEGIN
  ALTER TABLE promo_panel."Category" ADD CONSTRAINT "Category_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES promo_panel."Category"(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "Category_parentId_idx" ON promo_panel."Category"("parentId");

ALTER TABLE promo_panel."Collection"
  ADD COLUMN IF NOT EXISTS "icon" TEXT,
  ADD COLUMN IF NOT EXISTS "matchKeywords" TEXT,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS promo_panel."ProductCollection" (
  "collectionId" TEXT NOT NULL,
  "productId"    TEXT NOT NULL,
  "addedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductCollection_pkey" PRIMARY KEY ("collectionId", "productId"),
  CONSTRAINT "ProductCollection_collectionId_fkey" FOREIGN KEY ("collectionId")
    REFERENCES promo_panel."Collection"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProductCollection_productId_fkey" FOREIGN KEY ("productId")
    REFERENCES promo_panel."Product"(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProductCollection_productId_idx" ON promo_panel."ProductCollection"("productId");
