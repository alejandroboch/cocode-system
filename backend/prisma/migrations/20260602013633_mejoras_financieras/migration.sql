-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "ultimoLogin" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" SERIAL NOT NULL,
    "tarifaAgua" DECIMAL(10,2) NOT NULL,
    "tarifaSeguridad" DECIMAL(10,2) NOT NULL,
    "moraDefecto" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoFavor" (
    "id" SERIAL NOT NULL,
    "casaId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaldoFavor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaldoFavor_casaId_idx" ON "SaldoFavor"("casaId");

-- AddForeignKey
ALTER TABLE "SaldoFavor" ADD CONSTRAINT "SaldoFavor_casaId_fkey" FOREIGN KEY ("casaId") REFERENCES "Casa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoFavor" ADD CONSTRAINT "SaldoFavor_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
