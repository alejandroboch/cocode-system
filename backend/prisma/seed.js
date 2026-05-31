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
    where: { nombre: "Agua" },
    update: {},
    create: {
      nombre: "Agua"
    }
  });

  const seguridad = await prisma.servicio.upsert({
    where: { nombre: "Seguridad y Mantenimiento" },
    update: {},
    create: {
      nombre: "Seguridad y Mantenimiento"
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

  console.log("Seed ejecutado correctamente");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });