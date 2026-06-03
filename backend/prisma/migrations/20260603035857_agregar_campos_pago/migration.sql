/*
  Warnings:

  - Added the required column `montoDeuda` to the `Pago` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "montoDeuda" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "saldoAplicado" DECIMAL(10,2) NOT NULL DEFAULT 0;
