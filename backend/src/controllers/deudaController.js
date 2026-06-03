const prisma = require("../config/prisma");

const generarDeudas = async (req, res) => {

  try {

    const { anio, mes } = req.body;

    if (!anio || !mes) {
      return res.status(400).json({
        mensaje: "Año y mes son obligatorios"
      });
    }

    const casas = await prisma.casa.findMany({
      where: {
        activo: true
      }
    });

    const servicios = await prisma.servicio.findMany();

    let totalGeneradas = 0;

    for (const casa of casas) {

      for (const servicio of servicios) {

        const existeDeuda = await prisma.deuda.findUnique({
          where: {
            casaId_servicioId_anio_mes: {
              casaId: casa.id,
              servicioId: servicio.id,
              anio: Number(anio),
              mes: Number(mes)
            }
          }
        });

        if (existeDeuda) {
          continue;
        }

        const tarifaEspecial =
          await prisma.tarifaEspecial.findFirst({
            where: {
              casaId: casa.id,
              servicioId: servicio.id,
              activo: true
            }
          });

        const monto = tarifaEspecial
          ? tarifaEspecial.monto
          : servicio.montoBase;

        await prisma.deuda.create({
          data: {
            casaId: casa.id,
            servicioId: servicio.id,
            anio: Number(anio),
            mes: Number(mes),
            monto
          }
        });

        totalGeneradas++;

      }

    }

    return res.status(201).json({
      mensaje: "Deudas generadas correctamente",
      totalGeneradas
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al generar deudas"
    });

  }

};

const obtenerDeudasCasa = async (req, res) => {

    try {
  
      const { casaId } = req.params;
  
      const deudas = await prisma.deuda.findMany({
        where: {
          casaId: Number(casaId)
        },
        include: {
          servicio: true
        },
        orderBy: [
          {
            anio: "asc"
          },
          {
            mes: "asc"
          }
        ]
      });
  
      return res.json(deudas);
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al consultar deudas"
      });
  
    }
  
  };

  const obtenerSiguienteDeuda = async (req, res) => {

    try {
  
      const { casaId, servicioId } = req.params;
  
      const deuda = await prisma.deuda.findFirst({
        where: {
          casaId: Number(casaId),
          servicioId: Number(servicioId),
          estado: "PENDIENTE"
        },
        orderBy: [
          {
            anio: "asc"
          },
          {
            mes: "asc"
          }
        ]
      });
  
      if (!deuda) {
        return res.status(404).json({
          mensaje: "No existen deudas pendientes"
        });
      }
  
      return res.json(deuda);
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al consultar deuda"
      });
  
    }
  
  };

module.exports = {
  generarDeudas,
  obtenerDeudasCasa,
  obtenerSiguienteDeuda
};