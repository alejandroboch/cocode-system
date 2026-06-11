const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {

  // Roles
  const adminRol = await prisma.rol.upsert({
    where: { nombre: "ADMINISTRADOR" },
    update: {},
    create: {
      nombre: "ADMINISTRADOR",
      descripcion: "Acceso completo"
    }
  });

  const secretariaRol = await prisma.rol.upsert({
    where: { nombre: "SECRETARIA" },
    update: {},
    create: {
      nombre: "SECRETARIA",
      descripcion: "Gestión administrativa"
    }
  });

  // Servicios
  const agua = await prisma.servicio.upsert({
    where: { nombre: "AGUA" },
    update: {},
    create: {
      nombre: "AGUA",
      montoBase: 100
    }
  });

  const seguridad = await prisma.servicio.upsert({
    where: { nombre: "SEGURIDAD Y MANTENIMIENTO" },
    update: {},
    create: {
      nombre: "SEGURIDAD Y MANTENIMIENTO",
      montoBase: 100
    }
  });

  const reconexionAgua = await prisma.servicio.upsert({
    where: { nombre: "RECONEXION DE AGUA" },
    update: {},
    create: {
      nombre: "RECONEXION DE AGUA",
      montoBase: 50
    }
  });

  // Correlativos
  await prisma.correlativoRecibo.upsert({
    where: {
      servicioId: agua.id
    },
    update: {},
    create: {
      servicioId: agua.id,
      prefijo: "A",
      ultimoNumero: 0
    }
  });

  await prisma.correlativoRecibo.upsert({
    where: {
      servicioId: seguridad.id
    },
    update: {},
    create: {
      servicioId: seguridad.id,
      prefijo: "S",
      ultimoNumero: 0
    }
  });

  await prisma.correlativoRecibo.upsert({
    where: {
      servicioId: reconexionAgua.id
    },
    update: {},
    create: {
      servicioId: reconexionAgua.id,
      prefijo: "R",
      ultimoNumero: 0
    }
  });

  const configExistente = await prisma.configuracion.findFirst();

  if (!configExistente) {
    await prisma.configuracion.create({
      data: {
        tarifaAgua: 100,
        tarifaSeguridad: 100,
        moraDefecto: 25
      }
    });
  }

  console.log("Seed ejecutado correctamente");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });