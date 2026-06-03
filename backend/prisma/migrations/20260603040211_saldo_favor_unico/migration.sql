/*
  Warnings:

  - A unique constraint covering the columns `[casaId,servicioId]` on the table `SaldoFavor` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SaldoFavor_casaId_idx";

-- AlterTable
ALTER TABLE "SaldoFavor" ALTER COLUMN "monto" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "SaldoFavor_casaId_servicioId_key" ON "SaldoFavor"("casaId", "servicioId");
