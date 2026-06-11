-- AlterTable Recibo: datos del cobro agrupado
ALTER TABLE "Recibo" ADD COLUMN "casaId" INTEGER;
ALTER TABLE "Recibo" ADD COLUMN "servicioId" INTEGER;
ALTER TABLE "Recibo" ADD COLUMN "usuarioId" INTEGER;
ALTER TABLE "Recibo" ADD COLUMN "montoTotal" DECIMAL(10,2);
ALTER TABLE "Recibo" ADD COLUMN "montoPagado" DECIMAL(10,2);

-- AlterTable Pago: enlace al recibo
ALTER TABLE "Pago" ADD COLUMN "reciboId" INTEGER;

-- Migrar recibos existentes (1 pago = 1 recibo)
UPDATE "Recibo" r
SET
  "casaId" = d."casaId",
  "servicioId" = d."servicioId",
  "usuarioId" = p."usuarioId",
  "montoTotal" = p."montoDeuda",
  "montoPagado" = p."montoPagado"
FROM "Pago" p
JOIN "Deuda" d ON d."id" = p."deudaId"
WHERE r."pagoId" = p."id";

UPDATE "Pago" p
SET "reciboId" = r."id"
FROM "Recibo" r
WHERE r."pagoId" = p."id";

-- Quitar relación 1:1 anterior
ALTER TABLE "Recibo" DROP CONSTRAINT "Recibo_pagoId_fkey";
DROP INDEX IF EXISTS "Recibo_pagoId_key";
ALTER TABLE "Recibo" DROP COLUMN "pagoId";

ALTER TABLE "Pago" DROP COLUMN "montoPagado";

-- NOT NULL y FKs
ALTER TABLE "Recibo" ALTER COLUMN "casaId" SET NOT NULL;
ALTER TABLE "Recibo" ALTER COLUMN "servicioId" SET NOT NULL;
ALTER TABLE "Recibo" ALTER COLUMN "usuarioId" SET NOT NULL;
ALTER TABLE "Recibo" ALTER COLUMN "montoTotal" SET NOT NULL;
ALTER TABLE "Recibo" ALTER COLUMN "montoPagado" SET NOT NULL;
ALTER TABLE "Pago" ALTER COLUMN "reciboId" SET NOT NULL;

ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_casaId_fkey"
  FOREIGN KEY ("casaId") REFERENCES "Casa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_servicioId_fkey"
  FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_reciboId_fkey"
  FOREIGN KEY ("reciboId") REFERENCES "Recibo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Recibo_casaId_idx" ON "Recibo"("casaId");
CREATE INDEX "Recibo_servicioId_idx" ON "Recibo"("servicioId");
CREATE INDEX "Recibo_createdAt_idx" ON "Recibo"("createdAt");
CREATE INDEX "Pago_reciboId_idx" ON "Pago"("reciboId");
