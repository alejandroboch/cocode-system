const prisma = require("../config/prisma");
const { registrarBitacora } = require("../utils/bitacoraUtils");

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

    await registrarBitacora(prisma, {
      usuarioId: req.user.id,
      modulo: "SERVICIOS",
      accion: "CREAR",
      descripcion: `Servicio creado: ${nombreNormalizado}`
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

const editarServicio = async (req, res) => {

  try {

    const { id } = req.params;
    const {
      nombre,
      montoBase,
      prefijo
    } = req.body;

    const servicioExistente = await prisma.servicio.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        correlativo: true
      }
    });

    if (!servicioExistente) {
      return res.status(404).json({
        mensaje: "Servicio no encontrado"
      });
    }

    const data = {};

    if (montoBase !== undefined && montoBase !== null && montoBase !== "") {
      const montoNum = Number(montoBase);

      if (Number.isNaN(montoNum) || montoNum < 0) {
        return res.status(400).json({
          mensaje: "La tarifa base debe ser un monto válido"
        });
      }

      data.montoBase = montoNum;
    }

    if (nombre !== undefined && nombre !== null && String(nombre).trim() !== "") {
      const nombreNormalizado = String(nombre).trim().toUpperCase();

      if (nombreNormalizado !== servicioExistente.nombre) {
        const duplicado = await prisma.servicio.findUnique({
          where: {
            nombre: nombreNormalizado
          }
        });

        if (duplicado) {
          return res.status(400).json({
            mensaje: "Ya existe otro servicio con ese nombre"
          });
        }

        data.nombre = nombreNormalizado;
      }
    }

    const servicio = await prisma.servicio.update({
      where: {
        id: Number(id)
      },
      data,
      include: {
        correlativo: true
      }
    });

    if (
      prefijo !== undefined &&
      prefijo !== null &&
      String(prefijo).trim() !== ""
    ) {
      const prefijoNormalizado =
        String(prefijo).trim().toUpperCase();

      if (servicioExistente.correlativo) {
        await prisma.correlativoRecibo.update({
          where: {
            servicioId: servicio.id
          },
          data: {
            prefijo: prefijoNormalizado
          }
        });
      } else {
        await prisma.correlativoRecibo.create({
          data: {
            servicioId: servicio.id,
            prefijo: prefijoNormalizado,
            ultimoNumero: 0
          }
        });
      }
    }

    const servicioActualizado = await prisma.servicio.findUnique({
      where: {
        id: servicio.id
      },
      include: {
        correlativo: true
      }
    });

    await registrarBitacora(prisma, {
      usuarioId: req.user.id,
      modulo: "SERVICIOS",
      accion: "EDITAR",
      descripcion: `Servicio actualizado: ${servicioActualizado.nombre}`
    });

    return res.json({
      mensaje: "Servicio actualizado correctamente",
      servicio: servicioActualizado
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al actualizar servicio"
    });

  }

};

const eliminarServicio = async (req, res) => {

  try {

    const { id } = req.params;
    const servicioId = Number(id);

    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId },
      include: {
        correlativo: true
      }
    });

    if (!servicio) {
      return res.status(404).json({
        mensaje: "Servicio no encontrado"
      });
    }

    const pagosRegistrados = await prisma.pago.count({
      where: {
        deuda: {
          servicioId
        }
      }
    });

    if (pagosRegistrados > 0) {
      return res.status(400).json({
        mensaje:
          "No se puede eliminar este servicio porque ya tiene cobros registrados. Conserva el historial contable."
      });
    }

    await prisma.$transaction(async (tx) => {

      await tx.tarifaEspecial.deleteMany({
        where: { servicioId }
      });

      await tx.deuda.deleteMany({
        where: { servicioId }
      });

      if (servicio.correlativo) {
        await tx.correlativoRecibo.delete({
          where: { servicioId }
        });
      }

      await tx.servicio.delete({
        where: { id: servicioId }
      });

      await tx.bitacora.create({
        data: {
          usuarioId: req.user.id,
          modulo: "SERVICIOS",
          accion: "ELIMINAR",
          descripcion: `Servicio eliminado: ${servicio.nombre}`
        }
      });

    });

    return res.json({
      mensaje: "Servicio eliminado correctamente"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al eliminar servicio"
    });

  }

};

module.exports = {
  crearServicio,
  listarServicios,
  editarServicio,
  eliminarServicio
};