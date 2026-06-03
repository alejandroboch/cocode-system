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

const listarTarifasEspeciales = async (req, res) => {

    try {
  
      const tarifas = await prisma.tarifaEspecial.findMany({
        include: {
          casa: true,
          servicio: true
        },
        orderBy: {
          id: "desc"
        }
      });
  
      return res.json(tarifas);
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al listar tarifas especiales"
      });
  
    }
  
  };

  const desactivarTarifaEspecial = async (req, res) => {

    try {
  
      const { id } = req.params;
  
      const tarifa = await prisma.tarifaEspecial.findUnique({
        where: {
          id: Number(id)
        }
      });
  
      if (!tarifa) {
        return res.status(404).json({
          mensaje: "Tarifa especial no encontrada"
        });
      }
  
      const actualizada =
        await prisma.tarifaEspecial.update({
          where: {
            id: Number(id)
          },
          data: {
            activo: false
          }
        });
  
      return res.json(actualizada);
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al desactivar tarifa especial"
      });
  
    }
  
  };

module.exports = {
  crearTarifaEspecial,
  listarTarifasEspeciales,
  desactivarTarifaEspecial
};