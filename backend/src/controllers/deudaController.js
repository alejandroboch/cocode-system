const prisma = require("../config/prisma");
const {
  esServicioSeguridad,
  esMesCobroVehicular,
  calcularCargoVehicular,
  construirConteoPlacasPorCasa,
  obtenerMoraDefecto,
  enriquecerDeudaParaRespuesta
} = require("../lib/reglasCobro");

const generarDeudas = async (req, res) => {

  try {

    const { anio, mes, servicioIds } = req.body;

    if (!anio || !mes) {
      return res.status(400).json({
        mensaje: "Año y mes son obligatorios"
      });
    }

    if (
      !Array.isArray(servicioIds) ||
      servicioIds.length === 0
    ) {
      return res.status(400).json({
        mensaje: "Debe seleccionar al menos un servicio"
      });
    }

    const ids = servicioIds.map(Number);

    const servicios = await prisma.servicio.findMany({
      where: {
        id: {
          in: ids
        }
      },
      orderBy: {
        nombre: "asc"
      }
    });

    if (servicios.length !== ids.length) {
      return res.status(400).json({
        mensaje: "Uno o más servicios seleccionados no existen"
      });
    }

    const casas = await prisma.casa.findMany({
      where: {
        activo: true
      }
    });

    const mesNum = Number(mes);
    const aplicaCobroVehicular = esMesCobroVehicular(mesNum);
    const incluyeSeguridad = servicios.some((s) =>
      esServicioSeguridad(s.nombre)
    );

    let conteoPlacasPorCasa = new Map();

    if (aplicaCobroVehicular && incluyeSeguridad) {
      const placas = await prisma.placaCasa.findMany({
        select: {
          casaId: true,
          tipo: true
        }
      });
      conteoPlacasPorCasa = construirConteoPlacasPorCasa(placas);
    }

    let totalGeneradas = 0;
    let totalOmitidas = 0;

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
          totalOmitidas++;
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

        let monto = tarifaEspecial
          ? Number(tarifaEspecial.monto)
          : Number(servicio.montoBase);

        if (
          aplicaCobroVehicular &&
          esServicioSeguridad(servicio.nombre)
        ) {
          const conteo =
            conteoPlacasPorCasa.get(casa.id) ?? { auto: 0, moto: 0 };
          monto += calcularCargoVehicular(conteo);
        }

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

    await prisma.bitacora.create({
      data: {
        usuarioId: req.user.id,
        modulo: "DEUDAS",
        accion: "GENERAR",
        descripcion:
          `Deudas ${mes}/${anio} — ${totalGeneradas} creadas (${servicios.map((s) => s.nombre).join(", ")})`
      }
    });

    return res.status(201).json({
      mensaje: "Deudas generadas correctamente",
      totalGeneradas,
      totalOmitidas,
      cobroVehicularIncluido:
        aplicaCobroVehicular && incluyeSeguridad,
      servicios: servicios.map((s) => ({
        id: s.id,
        nombre: s.nombre
      }))
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al generar deudas"
    });

  }

};

const resumenPeriodo = async (req, res) => {

  try {

    const { anio, mes } = req.query;

    if (!anio || !mes) {
      return res.status(400).json({
        mensaje: "Año y mes son obligatorios"
      });
    }

    const anioNum = Number(anio);
    const mesNum = Number(mes);

    const servicios = await prisma.servicio.findMany({
      orderBy: {
        nombre: "asc"
      }
    });

    const deudas = await prisma.deuda.findMany({
      where: {
        anio: anioNum,
        mes: mesNum
      },
      include: {
        servicio: true,
        pago: true
      }
    });

    const porServicio = servicios.map((servicio) => {

      const delServicio =
        deudas.filter((d) => d.servicioId === servicio.id);

      const pendientes =
        delServicio.filter((d) => d.estado === "PENDIENTE");

      const pagadas =
        delServicio.filter((d) => d.estado === "PAGADA");

      const eliminables =
        pendientes.filter((d) => d.pago.length === 0);

      return {
        id: servicio.id,
        nombre: servicio.nombre,
        montoBase: Number(servicio.montoBase),
        total: delServicio.length,
        pendientes: pendientes.length,
        pagadas: pagadas.length,
        eliminables: eliminables.length
      };

    });

    return res.json({
      anio: anioNum,
      mes: mesNum,
      totalDeudas: deudas.length,
      servicios: porServicio
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al consultar resumen del periodo"
    });

  }

};

const eliminarGeneracionMes = async (req, res) => {

  try {

    const { anio, mes, servicioIds } = req.body;

    if (!anio || !mes) {
      return res.status(400).json({
        mensaje: "Año y mes son obligatorios"
      });
    }

    if (
      !Array.isArray(servicioIds) ||
      servicioIds.length === 0
    ) {
      return res.status(400).json({
        mensaje: "Debe seleccionar al menos un servicio"
      });
    }

    const ids = servicioIds.map(Number);

    const deudas = await prisma.deuda.findMany({
      where: {
        anio: Number(anio),
        mes: Number(mes),
        servicioId: {
          in: ids
        },
        esExtra: false
      },
      include: {
        servicio: true,
        pago: true
      }
    });

    if (deudas.length === 0) {
      return res.status(404).json({
        mensaje: "No hay deudas generadas para ese periodo y servicios"
      });
    }

    const eliminables = deudas.filter(
      (d) => d.estado === "PENDIENTE" && d.pago.length === 0
    );

    const bloqueadas = deudas.length - eliminables.length;

    if (eliminables.length === 0) {
      return res.status(400).json({
        mensaje:
          "No se puede eliminar: las deudas del periodo ya fueron pagadas o tienen cobros asociados"
      });
    }

    await prisma.deuda.deleteMany({
      where: {
        id: {
          in: eliminables.map((d) => d.id)
        }
      }
    });

    await prisma.bitacora.create({
      data: {
        usuarioId: req.user.id,
        modulo: "DEUDAS",
        accion: "ELIMINAR_GENERACION",
        descripcion:
          `Eliminadas ${eliminables.length} deuda(s) de ${mes}/${anio}`
      }
    });

    return res.json({
      mensaje: "Generación del periodo eliminada correctamente",
      totalEliminadas: eliminables.length,
      totalBloqueadas: bloqueadas
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al eliminar generación del periodo"
    });

  }

};

const obtenerDeudasCasa = async (req, res) => {

    try {
  
      const { casaId } = req.params;
  
      const moraDefecto = await obtenerMoraDefecto(prisma);

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
  
      return res.json(
        deudas.map((deuda) =>
          enriquecerDeudaParaRespuesta(deuda, moraDefecto)
        )
      );
  
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

const crearCobroExtra = async (req, res) => {

  try {

    const {
      casaId,
      servicioId,
      anio,
      mes,
      monto,
      observaciones
    } = req.body;

    if (!casaId || !servicioId || !anio || !mes) {
      return res.status(400).json({
        mensaje: "Casa, servicio, año y mes son obligatorios"
      });
    }

    const montoNum = Number(monto);

    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      return res.status(400).json({
        mensaje: "El monto debe ser mayor a cero"
      });
    }

    const casa = await prisma.casa.findUnique({
      where: {
        id: Number(casaId)
      }
    });

    if (!casa) {
      return res.status(404).json({
        mensaje: "Casa no encontrada"
      });
    }

    const servicio = await prisma.servicio.findUnique({
      where: {
        id: Number(servicioId)
      }
    });

    if (!servicio) {
      return res.status(404).json({
        mensaje: "Servicio no encontrado"
      });
    }

    const anioNum = Number(anio);
    const mesNum = Number(mes);

    const existeDeuda = await prisma.deuda.findUnique({
      where: {
        casaId_servicioId_anio_mes: {
          casaId: casa.id,
          servicioId: servicio.id,
          anio: anioNum,
          mes: mesNum
        }
      }
    });

    if (existeDeuda) {
      return res.status(409).json({
        mensaje:
          "Ya existe una deuda de ese servicio para esa casa en el periodo indicado"
      });
    }

    const nota = String(observaciones ?? "").trim() || null;

    const deuda = await prisma.deuda.create({
      data: {
        casaId: casa.id,
        servicioId: servicio.id,
        anio: anioNum,
        mes: mesNum,
        monto: montoNum,
        esExtra: true,
        observaciones: nota
      },
      include: {
        servicio: true,
        casa: true
      }
    });

    await prisma.bitacora.create({
      data: {
        usuarioId: req.user.id,
        modulo: "DEUDAS",
        accion: "COBRO_EXTRA",
        descripcion:
          `Cobro extra ${servicio.nombre} — Mz ${casa.manzana} Lt ${casa.lote} — Q${montoNum} (${mesNum}/${anioNum})`
      }
    });

    const moraDefecto = await obtenerMoraDefecto(prisma);

    return res.status(201).json({
      mensaje: "Cobro extra registrado. Ya aparece en deudas pendientes para cobrar.",
      deuda: enriquecerDeudaParaRespuesta(deuda, moraDefecto)
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al registrar cobro extra"
    });

  }

};

const listarCobrosExtra = async (req, res) => {

  try {

    const { estado, casaId } = req.query;

    const where = {
      esExtra: true
    };

    if (estado === "PENDIENTE" || estado === "PAGADA") {
      where.estado = estado;
    }

    if (casaId) {
      where.casaId = Number(casaId);
    }

    const moraDefecto = await obtenerMoraDefecto(prisma);

    const deudas = await prisma.deuda.findMany({
      where,
      include: {
        servicio: true,
        casa: true,
        pago: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(
      deudas.map((deuda) => ({
        ...enriquecerDeudaParaRespuesta(deuda, moraDefecto),
        casa: {
          id: deuda.casa.id,
          codigoCasa: deuda.casa.codigoCasa,
          manzana: deuda.casa.manzana,
          lote: deuda.casa.lote,
          propietario: deuda.casa.propietarioActual
        },
        tieneCobros: deuda.pago.length > 0
      }))
    );

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al listar cobros extras"
    });

  }

};

const eliminarCobroExtra = async (req, res) => {

  try {

    const { id } = req.params;

    const deuda = await prisma.deuda.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        servicio: true,
        casa: true,
        pago: true
      }
    });

    if (!deuda || !deuda.esExtra) {
      return res.status(404).json({
        mensaje: "Cobro extra no encontrado"
      });
    }

    if (deuda.estado !== "PENDIENTE" || deuda.pago.length > 0) {
      return res.status(400).json({
        mensaje:
          "Solo se pueden eliminar cobros extras pendientes sin cobros asociados"
      });
    }

    await prisma.deuda.delete({
      where: {
        id: deuda.id
      }
    });

    await prisma.bitacora.create({
      data: {
        usuarioId: req.user.id,
        modulo: "DEUDAS",
        accion: "ELIMINAR_COBRO_EXTRA",
        descripcion:
          `Eliminado cobro extra ${deuda.servicio.nombre} — Mz ${deuda.casa.manzana} Lt ${deuda.casa.lote}`
      }
    });

    return res.json({
      mensaje: "Cobro extra eliminado correctamente"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al eliminar cobro extra"
    });

  }

};

module.exports = {
  generarDeudas,
  resumenPeriodo,
  eliminarGeneracionMes,
  obtenerDeudasCasa,
  obtenerSiguienteDeuda,
  crearCobroExtra,
  listarCobrosExtra,
  eliminarCobroExtra
};
