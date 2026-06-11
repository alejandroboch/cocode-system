-- DropTable
DROP TABLE IF EXISTS "SaldoFavor";

-- AlterTable
ALTER TABLE "Pago" DROP COLUMN IF EXISTS "saldoAplicado";
ALTER TABLE "Pago" DROP COLUMN IF EXISTS "saldoGenerado";
