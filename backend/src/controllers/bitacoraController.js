const prisma = require("../config/prisma");

const listarBitacora = async (req, res) => {

  try {

    const {
      usuarioId,
      modulo,
      accion,
      desde,
      hasta,
      page = "1",
      limit = "50"
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (usuarioId) {
      where.usuarioId = Number(usuarioId);
    }

    if (modulo) {
      where.modulo = String(modulo).toUpperCase();
    }

    if (accion) {
      where.accion = String(accion).toUpperCase();
    }

    if (desde || hasta) {
      where.fecha = {};

      if (desde) {
        where.fecha.gte = new Date(`${desde}T00:00:00.000`);
      }

      if (hasta) {
        where.fecha.lte = new Date(`${hasta}T23:59:59.999`);
      }
    }

    const [total, registros] = await Promise.all([
      prisma.bitacora.count({ where }),
      prisma.bitacora.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              usuario: true,
              rol: {
                select: {
                  nombre: true
                }
              }
            }
          }
        },
        orderBy: {
          fecha: "desc"
        },
        skip,
        take: limitNum
      })
    ]);

    return res.json({
      data: registros,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al consultar bitácora"
    });

  }

};

const listarOpcionesFiltro = async (req, res) => {

  try {

    const [modulos, acciones] = await Promise.all([
      prisma.bitacora.findMany({
        distinct: ["modulo"],
        select: { modulo: true },
        orderBy: { modulo: "asc" }
      }),
      prisma.bitacora.findMany({
        distinct: ["accion"],
        select: { accion: true },
        orderBy: { accion: "asc" }
      })
    ]);

    return res.json({
      modulos: modulos.map((m) => m.modulo),
      acciones: acciones.map((a) => a.accion)
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al cargar filtros de bitácora"
    });

  }

};

module.exports = {
  listarBitacora,
  listarOpcionesFiltro
};
