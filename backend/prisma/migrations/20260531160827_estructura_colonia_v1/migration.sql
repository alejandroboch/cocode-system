/*
  Warnings:

  - You are about to drop the column `nombreResponsable` on the `Casa` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codigoCasa]` on the table `Casa` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigoCasa` to the `Casa` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoDeuda" AS ENUM ('PENDIENTE', 'PAGADA');

-- CreateEnum
CREATE TYPE "EstadoRecibo" AS ENUM ('ACTIVO', 'ANULADO');

-- AlterTable
ALTER TABLE "Casa" DROP COLUMN "nombreResponsable",
ADD COLUMN     "codigoCasa" INTEGER NOT NULL,
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "propietarioActual" TEXT;

-- CreateTable
CREATE TABLE "Bitacora" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrelativoRecibo" (
    "id" SERIAL NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "prefijo" TEXT NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CorrelativoRecibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarifaEspecial" (
    "id" SERIAL NOT NULL,
    "casaId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TarifaEspecial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deuda" (
    "id" SERIAL NOT NULL,
    "casaId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "mora" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" "EstadoDeuda" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "deudaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montoPagado" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recibo" (
    "id" SERIAL NOT NULL,
    "pagoId" INTEGER NOT NULL,
    "numeroRecibo" TEXT NOT NULL,
    "estado" "EstadoRecibo" NOT NULL DEFAULT 'ACTIVO',
    "motivoAnulacion" TEXT,
    "fechaAnulacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorteAgua" (
    "id" SERIAL NOT NULL,
    "casaId" INTEGER NOT NULL,
    "fechaCorte" TIMESTAMP(3) NOT NULL,
    "fechaReconexion" TIMESTAMP(3),
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CorteAgua_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bitacora_fecha_idx" ON "Bitacora"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Servicio_nombre_key" ON "Servicio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CorrelativoRecibo_servicioId_key" ON "CorrelativoRecibo"("servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "TarifaEspecial_casaId_servicioId_key" ON "TarifaEspecial"("casaId", "servicioId");

-- CreateIndex
CREATE INDEX "Deuda_anio_mes_idx" ON "Deuda"("anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "Deuda_casaId_servicioId_anio_mes_key" ON "Deuda"("casaId", "servicioId", "anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_deudaId_key" ON "Pago"("deudaId");

-- CreateIndex
CREATE INDEX "Pago_fechaPago_idx" ON "Pago"("fechaPago");

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_pagoId_key" ON "Recibo"("pagoId");

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_numeroRecibo_key" ON "Recibo"("numeroRecibo");

-- CreateIndex
CREATE UNIQUE INDEX "Casa_codigoCasa_key" ON "Casa"("codigoCasa");

-- CreateIndex
CREATE INDEX "Casa_codigoCasa_idx" ON "Casa"("codigoCasa");

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrelativoRecibo" ADD CONSTRAINT "CorrelativoRecibo_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarifaEspecial" ADD CONSTRAINT "TarifaEspecial_casaId_fkey" FOREIGN KEY ("casaId") REFERENCES "Casa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarifaEspecial" ADD CONSTRAINT "TarifaEspecial_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deuda" ADD CONSTRAINT "Deuda_casaId_fkey" FOREIGN KEY ("casaId") REFERENCES "Casa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deuda" ADD CONSTRAINT "Deuda_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_deudaId_fkey" FOREIGN KEY ("deudaId") REFERENCES "Deuda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorteAgua" ADD CONSTRAINT "CorteAgua_casaId_fkey" FOREIGN KEY ("casaId") REFERENCES "Casa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
