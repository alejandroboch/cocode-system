const prisma = require("../config/prisma");

const obtenerConfiguracion = async (req, res) => {

  try {

    const config = await prisma.configuracion.findFirst({
      orderBy: {
        id: "asc"
      }
    });

    if (!config) {
      return res.json({
        moraDefecto: 25,
        tarifaAgua: 0,
        tarifaSeguridad: 0
      });
    }

    return res.json({
      moraDefecto: Number(config.moraDefecto),
      tarifaAgua: Number(config.tarifaAgua),
      tarifaSeguridad: Number(config.tarifaSeguridad)
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al obtener configuración"
    });

  }

};

module.exports = {
  obtenerConfiguracion
};
