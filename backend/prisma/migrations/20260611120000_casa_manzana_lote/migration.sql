-- AlterTable
ALTER TABLE "Casa" ADD COLUMN "manzana" TEXT,
ADD COLUMN "lote" TEXT;

-- Backfill desde dirección cuando sea posible
UPDATE "Casa"
SET
  "manzana" = UPPER((regexp_match("direccion", 'Manzana\s*\.?\s*([A-Za-z0-9-]+)', 'i'))[1]),
  "lote" = UPPER((regexp_match("direccion", 'Lote\s*\.?\s*([A-Za-z0-9-]+)', 'i'))[1])
WHERE "direccion" ~* 'Manzana'
  AND "direccion" ~* 'Lote';

-- Normalizar manzanas y lotes puramente numéricos
UPDATE "Casa"
SET "manzana" = CAST(CAST("manzana" AS INTEGER) AS TEXT)
WHERE "manzana" ~ '^\d+$';

UPDATE "Casa"
SET "lote" = CAST(CAST("lote" AS INTEGER) AS TEXT)
WHERE "lote" ~ '^\d+$';

-- CreateIndex
CREATE UNIQUE INDEX "Casa_manzana_lote_key" ON "Casa"("manzana", "lote");

-- CreateIndex
CREATE INDEX "Casa_manzana_lote_idx" ON "Casa"("manzana", "lote");
