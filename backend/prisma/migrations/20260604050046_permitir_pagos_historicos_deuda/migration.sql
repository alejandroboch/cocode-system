-- DropIndex
DROP INDEX "Pago_deudaId_key";

-- CreateIndex
CREATE INDEX "Pago_deudaId_idx" ON "Pago"("deudaId");
