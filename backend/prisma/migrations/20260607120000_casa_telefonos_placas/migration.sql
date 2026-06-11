-- CreateEnum
CREATE TYPE "TipoPlaca" AS ENUM ('AUTO', 'MOTO');

-- CreateTable
CREATE TABLE "TelefonoCasa" (
    "id" SERIAL NOT NULL,
    "casaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelefonoCasa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacaCasa" (
    "id" SERIAL NOT NULL,
    "casaId" INTEGER NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" "TipoPlaca" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacaCasa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelefonoCasa_casaId_idx" ON "TelefonoCasa"("casaId");

-- CreateIndex
CREATE INDEX "PlacaCasa_casaId_idx" ON "PlacaCasa"("casaId");

-- CreateIndex
CREATE INDEX "PlacaCasa_placa_idx" ON "PlacaCasa"("placa");

-- AddForeignKey
ALTER TABLE "TelefonoCasa" ADD CONSTRAINT "TelefonoCasa_casaId_fkey" FOREIGN KEY ("casaId") REFERENCES "Casa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacaCasa" ADD CONSTRAINT "PlacaCasa_casaId_fkey" FOREIGN KEY ("casaId") REFERENCES "Casa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
