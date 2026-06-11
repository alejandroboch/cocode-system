-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "email" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "resetTokenHash" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "resetTokenExpires" TIMESTAMP(3);

UPDATE "Usuario"
SET "email" = LOWER("usuario") || '@cocode.local'
WHERE "email" IS NULL;

ALTER TABLE "Usuario" ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
