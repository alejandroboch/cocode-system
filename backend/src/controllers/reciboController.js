const prisma = require("../config/prisma");
const {
  esServicioSeguridad,
  formatearPlacasParaRecibo,
  combinarObservacionesRecibo
} = require("../lib/reglasCobro");

function codigoItemRecibo(codigoCasa, servicioId) {
  return `${codigoCasa}${String(servicioId).padStart(3, "0")}`;
}

function formatearPeriodoRecibo(pagos) {
  const ordenados = [...pagos].sort(
    (a, b) =>
      a.deuda.anio - b.deuda.anio ||
      a.deuda.mes - b.deuda.mes
  );

  if (ordenados.length === 0) {
    return "";
  }

  if (ordenados.length === 1) {
    const deuda = ordenados[0].deuda;
    return `${deuda.mes}/${deuda.anio}`;
  }

  const primero = ordenados[0].deuda;
  const ultimo = ordenados[ordenados.length - 1].deuda;

  return `${primero.mes}/${primero.anio} — ${ultimo.mes}/${ultimo.anio} (${ordenados.length} meses)`;
}

const includeReciboCompleto = {
  casa: true,
  servicio: true,
  usuario: true,
  pagos: {
    include: {
      deuda: true
    }
  }
};

const listarRecibos = async (req, res) => {

  try {

    const { estado, q } = req.query;

    const where = {};

    if (estado && estado !== "todos") {
      where.estado = estado;
    }

    const recibos = await prisma.recibo.findMany({
      where,
      include: includeReciboCompleto,
      orderBy: {
        createdAt: "desc"
      }
    });

    let resultado = recibos.map((recibo) => {

      const primerPago = recibo.pagos[0];

      return {
        numeroRecibo: recibo.numeroRecibo,
        estado: recibo.estado,
        fechaEmision: recibo.createdAt,
        fechaAnulacion: recibo.fechaAnulacion,
        motivoAnulacion: recibo.motivoAnulacion,
        observaciones: recibo.observaciones,

        codigoCasa: recibo.casa.codigoCasa,
        manzana: recibo.casa.manzana,
        lote: recibo.casa.lote,
        propietario: recibo.casa.propietarioActual,
        direccion: recibo.casa.direccion,

        servicio: recibo.servicio.nombre,
        periodo: formatearPeriodoRecibo(recibo.pagos),
        cantidadPeriodos: recibo.pagos.length,
        mes: primerPago?.deuda.mes,
        anio: primerPago?.deuda.anio,

        monto: Number(recibo.montoTotal),
        efectivoRecibido: Number(recibo.montoPagado),

        usuarioCobro: recibo.usuario.nombre,
        deudaIds: recibo.pagos.map((pago) => pago.deudaId)
      };

    });

    if (q && String(q).trim()) {

      const termino = String(q).trim().toLowerCase();

      resultado = resultado.filter((recibo) => {
        return (
          recibo.numeroRecibo.toLowerCase().includes(termino) ||
          String(recibo.codigoCasa).includes(termino) ||
          (recibo.manzana &&
            recibo.manzana.toLowerCase().includes(termino)) ||
          (recibo.lote &&
            recibo.lote.toLowerCase().includes(termino)) ||
          (recibo.propietario &&
            recibo.propietario.toLowerCase().includes(termino)) ||
          recibo.servicio.toLowerCase().includes(termino) ||
          recibo.periodo.toLowerCase().includes(termino)
        );
      });

    }

    return res.json(resultado);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al listar recibos"
    });

  }

};

const obtenerRecibo = async (req, res) => {

  try {

    const { numeroRecibo } = req.params;

    const recibo = await prisma.recibo.findUnique({
      where: {
        numeroRecibo
      },
      include: includeReciboCompleto
    });

    if (!recibo) {
      return res.status(404).json({
        mensaje: "Recibo no encontrado"
      });
    }

    const pagosOrdenados = [...recibo.pagos].sort(
      (a, b) =>
        a.deuda.anio - b.deuda.anio ||
        a.deuda.mes - b.deuda.mes
    );

    let totalMontoBase = 0;
    let totalMora = 0;

    const lineas = pagosOrdenados.map((pago, index) => {
      const deuda = pago.deuda;
      const montoBase = Number(deuda.monto);
      const mora = Number(deuda.mora);
      const total = Number(pago.montoDeuda);

      totalMontoBase += montoBase;
      totalMora += mora;

      return {
        item: index + 1,
        codigo: codigoItemRecibo(
          recibo.casa.codigoCasa,
          recibo.servicioId
        ),
        descripcion: recibo.servicio.nombre,
        periodo: {
          mes: deuda.mes,
          anio: deuda.anio
        },
        montoBase,
        mora,
        total
      };
    });

    const efectivoRecibido = Number(recibo.montoPagado);
    const totalCancelado = Number(recibo.montoTotal);

    let observaciones = recibo.observaciones;

    if (esServicioSeguridad(recibo.servicio.nombre)) {
      const placas = await prisma.placaCasa.findMany({
        where: {
          casaId: recibo.casaId
        },
        orderBy: [
          { tipo: "asc" },
          { placa: "asc" }
        ]
      });

      observaciones = combinarObservacionesRecibo(
        recibo.observaciones,
        formatearPlacasParaRecibo(placas)
      );
    }

    return res.json({
      numeroRecibo: recibo.numeroRecibo,
      fecha: recibo.createdAt,

      estado: recibo.estado,
      observaciones,

      casa: {
        codigoCasa: recibo.casa.codigoCasa,
        manzana: recibo.casa.manzana,
        lote: recibo.casa.lote,
        propietario: recibo.casa.propietarioActual,
        direccion: recibo.casa.direccion
      },

      servicio: recibo.servicio.nombre,

      item: lineas.length === 1
        ? {
            codigo: lineas[0].codigo,
            descripcion: lineas[0].descripcion
          }
        : {
            codigo: codigoItemRecibo(
              recibo.casa.codigoCasa,
              recibo.servicioId
            ),
            descripcion: recibo.servicio.nombre
          },

      periodo: lineas.length === 1
        ? lineas[0].periodo
        : {
            mes: lineas[0].periodo.mes,
            anio: lineas[0].periodo.anio,
            mesHasta: lineas[lineas.length - 1].periodo.mes,
            anioHasta: lineas[lineas.length - 1].periodo.anio,
            cantidad: lineas.length
          },

      lineas,

      detallePago: {
        montoDeuda: totalMontoBase,
        mora: totalMora,
        totalDeuda: totalCancelado,
        efectivoRecibido,
        totalCancelado,
        cambio: Math.max(0, efectivoRecibido - totalCancelado)
      },

      cobrador: {
        id: recibo.usuario.id,
        nombre: recibo.usuario.nombre
      },

      usuario: recibo.usuario.nombre
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al consultar recibo"
    });

  }

};

const obtenerRecibosPorCasa = async (req, res) => {

    try {
  
      const { codigoCasa } = req.params;
  
      const recibos = await prisma.recibo.findMany({
        where: {
          casa: {
            codigoCasa: Number(codigoCasa)
          }
        },
        include: includeReciboCompleto,
        orderBy: {
          createdAt: "desc"
        }
      });
  
      return res.json(
        recibos.map((recibo) => ({
          numeroRecibo: recibo.numeroRecibo,
          estado: recibo.estado,
          fecha: recibo.createdAt,
          servicio: recibo.servicio.nombre,
          periodo: formatearPeriodoRecibo(recibo.pagos),
          cantidadPeriodos: recibo.pagos.length,
          total: Number(recibo.montoTotal)
        }))
      );
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al consultar recibos"
      });
  
    }
  
  };

  const anularRecibo = async (req, res) => {

    try {
  
      const { numeroRecibo } = req.params;
      const { motivo } = req.body;
  
      if (!motivo) {
        return res.status(400).json({
          mensaje: "Debe indicar un motivo de anulación"
        });
      }
  
      const usuarioId = req.user.id;
  
      await prisma.$transaction(async (tx) => {
  
        const recibo = await tx.recibo.findUnique({
          where: {
            numeroRecibo
          },
          include: {
            pagos: {
              include: {
                deuda: true
              }
            }
          }
        });
  
        if (!recibo) {
          throw new Error("Recibo no encontrado");
        }
  
        if (recibo.estado === "ANULADO") {
          throw new Error("El recibo ya está anulado");
        }
  
        await tx.recibo.update({
          where: {
            id: recibo.id
          },
          data: {
            estado: "ANULADO",
            motivoAnulacion: motivo,
            fechaAnulacion: new Date()
          }
        });

        for (const pago of recibo.pagos) {
          await tx.deuda.update({
            where: {
              id: pago.deudaId
            },
            data: {
              estado: "PENDIENTE"
            }
          });
        }

        await tx.bitacora.create({
          data: {
            usuarioId,
            modulo: "RECIBOS",
            accion: "ANULAR",
            descripcion:
              `Recibo anulado ${numeroRecibo} (${recibo.pagos.length} periodo(s))`
          }
        });
  
      });
  
      return res.json({
        mensaje: "Recibo anulado correctamente"
      });
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(400).json({
        mensaje: error.message
      });
  
    }
  
  };

module.exports = {
  listarRecibos,
  obtenerRecibo,
  obtenerRecibosPorCasa,
  anularRecibo
};
