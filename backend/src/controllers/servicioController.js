const prisma = require("../config/prisma");



const crearServicio = async (req, res) => {

  try {

    const {
      nombre,
      montoBase,
      prefijo
    } = req.body;

const nombreNormalizado = nombre
  .trim()
  .toUpperCase();

    const existe = await prisma.servicio.findUnique({
      where: {
        nombre: nombreNormalizado
      }
    });

    if (existe) {
      return res.status(400).json({
        mensaje: "El servicio ya existe"
      });
    }

    const servicio = await prisma.servicio.create({
      data: {
        nombre: nombreNormalizado,
        montoBase
      }
    });

    await prisma.correlativoRecibo.create({
      data: {
        servicioId: servicio.id,
        prefijo,
        ultimoNumero: 0
      }
    });

    return res.status(201).json({
      mensaje: "Servicio creado correctamente",
      servicio
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al crear servicio"
    });

  }

};

const listarServicios = async (req, res) => {

  try {

    const servicios = await prisma.servicio.findMany({
      include: {
        correlativo: true
      },
      orderBy: {
        nombre: "asc"
      }
    });

    return res.json(servicios);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al listar servicios"
    });

  }

};

module.exports = {
  crearServicio,
  listarServicios
};