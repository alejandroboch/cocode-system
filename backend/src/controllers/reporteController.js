const prisma = require("../config/prisma");

const estadoCuenta = async (req, res) => {

  try {

    const { codigoCasa } = req.params;

    const casa = await prisma.casa.findUnique({
      where: {
        codigoCasa: Number(codigoCasa)
      }
    });

    if (!casa) {
      return res.status(404).json({
        mensaje: "Casa no encontrada"
      });
    }

    const deudasPendientes =
      await prisma.deuda.findMany({
        where: {
          casaId: casa.id,
          estado: "PENDIENTE"
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

    const saldosFavor =
      await prisma.saldoFavor.findMany({
        where: {
          casaId: casa.id
        },
        include: {
          servicio: true
        }
      });

    const totalPendiente =
      deudasPendientes.reduce(
        (total, deuda) =>
          total +
          Number(deuda.monto) +
          Number(deuda.mora),
        0
      );

    return res.json({
      casa: {
        codigoCasa: casa.codigoCasa,
        propietario: casa.propietarioActual,
        direccion: casa.direccion
      },

      totalPendiente,

      deudasPendientes:
        deudasPendientes.map((deuda) => ({
          id: deuda.id,
          servicio: deuda.servicio.nombre,
          mes: deuda.mes,
          anio: deuda.anio,
          monto: Number(deuda.monto),
          mora: Number(deuda.mora),
          total:
            Number(deuda.monto) +
            Number(deuda.mora)
        })),

      saldosFavor:
        saldosFavor.map((saldo) => ({
          servicio: saldo.servicio.nombre,
          monto: Number(saldo.monto)
        }))
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al consultar estado de cuenta"
    });

  }

};

const deudasPendientes = async (req, res) => {

    try {
  
      const casas = await prisma.casa.findMany({
        where: {
          activo: true
        },
        include: {
          deudas: {
            where: {
              estado: "PENDIENTE"
            }
          }
        }
      });
  
      const resultado = casas
        .map((casa) => {
  
          const totalPendiente =
            casa.deudas.reduce(
              (total, deuda) =>
                total +
                Number(deuda.monto) +
                Number(deuda.mora),
              0
            );
  
          return {
            codigoCasa: casa.codigoCasa,
            propietario: casa.propietarioActual,
            direccion: casa.direccion,
            cantidadDeudas: casa.deudas.length,
            totalPendiente
          };
  
        })
        .filter(
          casa => casa.cantidadDeudas > 0
        )
        .sort(
          (a, b) =>
            b.totalPendiente -
            a.totalPendiente
        );
  
      return res.json(resultado);
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje:
          "Error al consultar deudas pendientes"
      });
  
    }
  
  };

  const recaudacionMensual = async (req, res) => {

    try {
  
      const { anio, mes } = req.query;
  
      if (!anio || !mes) {
        return res.status(400).json({
          mensaje: "Año y mes son obligatorios"
        });
      }
  
      const pagos = await prisma.pago.findMany({
        where: {
          deuda: {
            anio: Number(anio),
            mes: Number(mes)
          },
          recibo: {
            estado: "ACTIVO"
          }
        },
        include: {
          deuda: {
            include: {
              servicio: true
            }
          }
        }
      });
  
      let totalRecaudado = 0;
  
      const porServicio = {};
  
      for (const pago of pagos) {
  
        const servicio =
          pago.deuda.servicio.nombre;
  
        const monto =
          Number(pago.montoDeuda);
  
        totalRecaudado += monto;
  
        if (!porServicio[servicio]) {
          porServicio[servicio] = 0;
        }
  
        porServicio[servicio] += monto;
  
      }
  
      return res.json({
        anio: Number(anio),
        mes: Number(mes),
  
        cantidadPagos: pagos.length,
  
        totalRecaudado,
  
        porServicio
      });
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje:
          "Error al generar reporte"
      });
  
    }
  
  };

  const saldosFavor = async (req, res) => {

    try {
  
      const saldos = await prisma.saldoFavor.findMany({
        include: {
          casa: true,
          servicio: true
        },
        orderBy: {
          monto: "desc"
        }
      });
  
      return res.json(
        saldos.map((saldo) => ({
          codigoCasa: saldo.casa.codigoCasa,
          propietario: saldo.casa.propietarioActual,
          servicio: saldo.servicio.nombre,
          saldo: Number(saldo.monto),
          observacion: saldo.observacion
        }))
      );
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al consultar saldos a favor"
      });
  
    }
  
  };

  const pagosPorFecha = async (req, res) => {

    try {
  
      const {
        inicio,
        fin
      } = req.query;
  
      if (!inicio || !fin) {
        return res.status(400).json({
          mensaje: "Debe indicar fecha inicio y fin"
        });
      }
  
      const fechaInicio = new Date(inicio);
      const fechaFin = new Date(fin);
  
      fechaFin.setHours(23, 59, 59, 999);
  
      const pagos = await prisma.pago.findMany({
        where: {
          fechaPago: {
            gte: fechaInicio,
            lte: fechaFin
          },
          recibo: {
            estado: "ACTIVO"
          }
        },
        include: {
          usuario: true,
          deuda: {
            include: {
              casa: true,
              servicio: true
            }
          },
          recibo: true
        },
        orderBy: {
          fechaPago: "desc"
        }
      });
  
      const totalRecaudado =
        pagos.reduce(
          (total, pago) =>
            total + Number(pago.montoDeuda),
          0
        );
  
      return res.json({
        fechaInicio: inicio,
        fechaFin: fin,
        cantidadPagos: pagos.length,
        totalRecaudado,
        pagos: pagos.map((pago) => ({
          numeroRecibo:
            pago.recibo.numeroRecibo,
  
          fecha:
            pago.fechaPago,
  
          codigoCasa:
            pago.deuda.casa.codigoCasa,
  
          propietario:
            pago.deuda.casa.propietarioActual,
  
          servicio:
            pago.deuda.servicio.nombre,
  
          periodo:
            `${pago.deuda.mes}/${pago.deuda.anio}`,
  
          monto:
            Number(pago.montoDeuda),
  
          usuario:
            pago.usuario.nombre
        }))
      });
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje:
          "Error al consultar pagos"
      });
  
    }
  
  };

module.exports = {
  estadoCuenta,
  deudasPendientes,
  recaudacionMensual,
  saldosFavor,
  pagosPorFecha
};