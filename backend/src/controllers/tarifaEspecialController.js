const prisma = require("../config/prisma");

const crearTarifaEspecial = async (req, res) => {

  try {

    const {
      casaId,
      servicioId,
      monto
    } = req.body;

    const existente = await prisma.tarifaEspecial.findFirst({
      where: {
        casaId: Number(casaId),
        servicioId: Number(servicioId)
      }
    });

    if (existente) {

      const actualizada =
        await prisma.tarifaEspecial.update({
          where: {
            id: existente.id
          },
          data: {
            monto,
            activo: true
          }
        });

      return res.json(actualizada);

    }

    const tarifa = await prisma.tarifaEspecial.create({
      data: {
        casaId: Number(casaId),
        servicioId: Number(servicioId),
        monto
      }
    });

    return res.status(201).json(tarifa);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al crear tarifa especial"
    });

  }

};

module.exports = {
  crearTarifaEspecial
};