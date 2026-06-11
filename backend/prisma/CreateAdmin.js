const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

async function main() {

  const passwordHash = await bcrypt.hash("Admin123*", 10);

  const rol = await prisma.rol.findFirst({
    where: {
      nombre: "ADMINISTRADOR"
    }
  });

  await prisma.usuario.create({
    data: {
      nombre: "Administrador",
      usuario: "admin",
      email: "admin@cocode.local",
      password: passwordHash,
      rolId: rol.id
    }
  });

  console.log("Administrador creado");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });