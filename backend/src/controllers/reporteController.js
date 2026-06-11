const prisma = require("../config/prisma");
const {
  obtenerMoraDefecto,
  enriquecerDeudaParaRespuesta,
  sumarTotalDeuda
} = require("../lib/reglasCobro");

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

    const moraDefecto = await obtenerMoraDefecto(prisma);

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

    const deudasEnriquecidas = deudasPendientes.map((deuda) =>
      enriquecerDeudaParaRespuesta(deuda, moraDefecto)
    );

    const totalPendiente = deudasEnriquecidas.reduce(
      (total, deuda) => total + deuda.total,
      0
    );

    return res.json({
      casa: {
        codigoCasa: casa.codigoCasa,
        manzana: casa.manzana,
        lote: casa.lote,
        propietario: casa.propietarioActual,
        direccion: casa.direccion
      },

      totalPendiente,

      deudasPendientes: deudasEnriquecidas
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
  
      const moraDefecto = await obtenerMoraDefecto(prisma);

      const casas = await prisma.casa.findMany({
        where: {
          activo: true
        },
        include: {
          deudas: {
            where: {
              estado: "PENDIENTE"
            },
            include: {
              servicio: true
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
                sumarTotalDeuda(deuda, moraDefecto),
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
  
      const fechaInicio = new Date(`${inicio}T00:00:00.000`);
      const fechaFin = new Date(`${fin}T23:59:59.999`);

      if (
        Number.isNaN(fechaInicio.getTime()) ||
        Number.isNaN(fechaFin.getTime())
      ) {
        return res.status(400).json({
          mensaje: "Las fechas indicadas no son válidas"
        });
      }

      if (fechaInicio > fechaFin) {
        return res.status(400).json({
          mensaje: "La fecha inicial no puede ser posterior a la final"
        });
      }
  
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

      const porServicioMap = {};

      for (const pago of pagos) {
        const nombre = pago.deuda.servicio.nombre;
        const monto = Number(pago.montoDeuda);

        if (!porServicioMap[nombre]) {
          porServicioMap[nombre] = {
            servicio: nombre,
            cantidad: 0,
            total: 0
          };
        }

        porServicioMap[nombre].cantidad += 1;
        porServicioMap[nombre].total += monto;
      }

      const porServicio = Object.values(porServicioMap)
        .sort((a, b) => b.total - a.total);
  
      return res.json({
        fechaInicio: inicio,
        fechaFin: fin,
        cantidadPagos: pagos.length,
        totalRecaudado,
        porServicio,
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

  const recibosAnulados = async (req, res) => {

    try {

      const { inicio, fin } = req.query;

      const where = {
        estado: "ANULADO"
      };

      if (inicio || fin) {

        if (!inicio || !fin) {
          return res.status(400).json({
            mensaje: "Debe indicar fecha inicio y fin"
          });
        }

        const fechaInicio = new Date(`${inicio}T00:00:00.000`);
        const fechaFin = new Date(`${fin}T23:59:59.999`);

        if (
          Number.isNaN(fechaInicio.getTime()) ||
          Number.isNaN(fechaFin.getTime())
        ) {
          return res.status(400).json({
            mensaje: "Las fechas indicadas no son válidas"
          });
        }

        where.fechaAnulacion = {
          gte: fechaInicio,
          lte: fechaFin
        };

      }
  
      const recibos = await prisma.recibo.findMany({
        where,
        include: {
          casa: true,
          servicio: true,
          usuario: true,
          pagos: {
            include: {
              deuda: true
            },
            orderBy: [
              { deuda: { anio: "asc" } },
              { deuda: { mes: "asc" } }
            ]
          }
        },
        orderBy: {
          fechaAnulacion: "desc"
        }
      });

      const totalAnulado = recibos.reduce(
        (total, recibo) =>
          total + Number(recibo.montoTotal),
        0
      );
  
      return res.json({
        fechaInicio: inicio ?? null,
        fechaFin: fin ?? null,
        cantidad: recibos.length,
        totalAnulado,
        recibos: recibos.map((recibo) => {
          const pagos = recibo.pagos;
          const primero = pagos[0]?.deuda;
          const ultimo = pagos[pagos.length - 1]?.deuda;
          const periodo =
            pagos.length > 1 && primero && ultimo
              ? `${primero.mes}/${primero.anio} — ${ultimo.mes}/${ultimo.anio}`
              : primero
                ? `${primero.mes}/${primero.anio}`
                : "";

          return {
            numeroRecibo: recibo.numeroRecibo,
            fechaEmision: recibo.createdAt,
            fechaAnulacion: recibo.fechaAnulacion,
            motivoAnulacion: recibo.motivoAnulacion,
  
            codigoCasa: recibo.casa.codigoCasa,
            propietario: recibo.casa.propietarioActual,
            direccion: recibo.casa.direccion,
  
            servicio: recibo.servicio.nombre,
            periodo,
  
            monto: Number(recibo.montoTotal),
            usuarioCobro: recibo.usuario.nombre
          };
        })
      });
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al consultar recibos anulados"
      });
  
    }
  
  };

  const listarMesesPeriodoDeuda = (
    fechaInicio,
    fechaFin,
    nombresMes,
    mesQuery,
    anioQuery
  ) => {

    if (mesQuery && anioQuery) {
      const mesNum = Number(mesQuery);
      const anioNum = Number(anioQuery);

      return [{
        mes: mesNum,
        anio: anioNum,
        etiqueta: `${nombresMes[mesNum - 1]} ${anioNum}`
      }];
    }

    const meses = [];
    let cursor = new Date(
      fechaInicio.getFullYear(),
      fechaInicio.getMonth(),
      1
    );
    const fin = new Date(
      fechaFin.getFullYear(),
      fechaFin.getMonth(),
      1
    );

    while (cursor <= fin) {
      const mes = cursor.getMonth() + 1;
      const anio = cursor.getFullYear();

      meses.push({
        mes,
        anio,
        etiqueta: `${nombresMes[mes - 1]} ${anio}`
      });

      cursor = new Date(anio, mes, 1);
    }

    return meses;

  };

  const calcularCoberturaServicios = (
    casasActivas,
    deudas,
    servicios
  ) => {

    return servicios.map((servicio) => {

      const deudasServicio =
        deudas.filter(
          (deuda) => deuda.servicioId === servicio.id
        );

      const casasPendientes = new Set(
        deudasServicio
          .filter((deuda) => deuda.estado === "PENDIENTE")
          .map((deuda) => deuda.casaId)
      ).size;

      const casasPagadas =
        Math.max(0, casasActivas - casasPendientes);

      const porcentaje = (cantidad) =>
        casasActivas > 0
          ? Math.round((cantidad / casasActivas) * 1000) / 10
          : 0;

      return {
        servicio: servicio.nombre,
        totalCasas: casasActivas,
        casasPagadas,
        casasPendientes,
        porcentajePagado: porcentaje(casasPagadas),
        porcentajePendiente: porcentaje(casasPendientes)
      };

    });

  };

  const dashboard = async (req, res) => {

    try {

      const { inicio, fin, mes, anio } = req.query;

      const hoy = new Date();
      const hoyFin = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate(),
        23,
        59,
        59,
        999
      );

      let fechaInicio;
      let fechaFin;
      let etiquetaPeriodo;

      const nombresMes = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];

      if (inicio && fin) {

        fechaInicio = new Date(`${inicio}T00:00:00.000`);
        fechaFin = new Date(`${fin}T23:59:59.999`);

        if (
          Number.isNaN(fechaInicio.getTime()) ||
          Number.isNaN(fechaFin.getTime())
        ) {
          return res.status(400).json({
            mensaje: "Las fechas indicadas no son válidas"
          });
        }

        if (fechaInicio > fechaFin) {
          return res.status(400).json({
            mensaje: "La fecha inicial no puede ser posterior a la final"
          });
        }

        etiquetaPeriodo = `${inicio} — ${fin}`;

      } else if (mes && anio) {

        const mesNum = Number(mes);
        const anioNum = Number(anio);

        if (
          Number.isNaN(mesNum) ||
          Number.isNaN(anioNum) ||
          mesNum < 1 ||
          mesNum > 12
        ) {
          return res.status(400).json({
            mensaje: "Mes o año no válidos"
          });
        }

        fechaInicio = new Date(anioNum, mesNum - 1, 1);
        fechaFin = new Date(anioNum, mesNum, 0, 23, 59, 59, 999);

        const esMesActual =
          anioNum === hoy.getFullYear() &&
          mesNum === hoy.getMonth() + 1;

        if (esMesActual && fechaFin > hoyFin) {
          fechaFin = hoyFin;
        }

        etiquetaPeriodo = `${nombresMes[mesNum - 1]} ${anioNum}`;

      } else {

        const mesActual = hoy.getMonth() + 1;
        const anioActual = hoy.getFullYear();

        fechaInicio = new Date(anioActual, mesActual - 1, 1);
        fechaFin = hoyFin;
        etiquetaPeriodo = `${nombresMes[mesActual - 1]} ${anioActual}`;

      }

      const moraDefecto = await obtenerMoraDefecto(prisma);

      const casasActivas =
        await prisma.casa.count({
          where: {
            activo: true
          }
        });

      const deudasPendientesLista =
        await prisma.deuda.findMany({
          where: {
            estado: "PENDIENTE"
          },
          include: {
            servicio: true
          }
        });

      const totalPendiente =
        deudasPendientesLista.reduce(
          (total, deuda) =>
            total + sumarTotalDeuda(deuda, moraDefecto),
          0
        );

      const deudasPorServicioMap = {};

      for (const deuda of deudasPendientesLista) {
        const nombre = deuda.servicio.nombre;
        const monto = sumarTotalDeuda(deuda, moraDefecto);

        if (!deudasPorServicioMap[nombre]) {
          deudasPorServicioMap[nombre] = {
            servicio: nombre,
            total: 0,
            cantidad: 0
          };
        }

        deudasPorServicioMap[nombre].total += monto;
        deudasPorServicioMap[nombre].cantidad += 1;
      }

      const deudasPorServicio = Object.values(deudasPorServicioMap)
        .sort((a, b) => b.total - a.total);

      const pagosPeriodo =
        await prisma.pago.findMany({
          where: {
            fechaPago: {
              gte: fechaInicio,
              lte: fechaFin
            },
            recibo: {
              estado: "ACTIVO"
            }
          }
        });

      const recaudadoPeriodo =
        pagosPeriodo.reduce(
          (total, pago) =>
            total + Number(pago.montoDeuda),
          0
        );

      const recaudacionPorDiaMap = {};

      for (const pago of pagosPeriodo) {
        const monto = Number(pago.montoDeuda);
        const dia = pago.fechaPago.toISOString().slice(0, 10);

        if (!recaudacionPorDiaMap[dia]) {
          recaudacionPorDiaMap[dia] = {
            fecha: dia,
            total: 0,
            cantidad: 0
          };
        }

        recaudacionPorDiaMap[dia].total += monto;
        recaudacionPorDiaMap[dia].cantidad += 1;
      }

      const recaudacionPorDia = Object.values(recaudacionPorDiaMap)
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

      const servicios =
        await prisma.servicio.findMany({
          orderBy: {
            nombre: "asc"
          }
        });

      const mesesDeuda =
        listarMesesPeriodoDeuda(
          fechaInicio,
          fechaFin,
          nombresMes,
          mes,
          anio
        );

      const filtroMesesDeuda =
        mesesDeuda.length > 0
          ? {
              OR: mesesDeuda.map((periodoDeuda) => ({
                mes: periodoDeuda.mes,
                anio: periodoDeuda.anio
              }))
            }
          : null;

      const deudasPendientesPeriodoLista =
        filtroMesesDeuda
          ? await prisma.deuda.findMany({
              where: {
                estado: "PENDIENTE",
                ...filtroMesesDeuda
              },
              include: {
                servicio: true
              }
            })
          : [];

      const deudasPendientesPeriodo =
        deudasPendientesPeriodoLista.length;

      const totalPendientePeriodo =
        deudasPendientesPeriodoLista.reduce(
          (total, deuda) =>
            total + sumarTotalDeuda(deuda, moraDefecto),
          0
        );

      const coberturaPorMes = [];

      for (const periodoDeuda of mesesDeuda) {

        const deudasMes =
          await prisma.deuda.findMany({
            where: {
              mes: periodoDeuda.mes,
              anio: periodoDeuda.anio
            },
            select: {
              casaId: true,
              servicioId: true,
              estado: true
            }
          });

        coberturaPorMes.push({
          mes: periodoDeuda.mes,
          anio: periodoDeuda.anio,
          etiqueta: periodoDeuda.etiqueta,
          servicios:
            calcularCoberturaServicios(
              casasActivas,
              deudasMes,
              servicios
            )
        });

      }

      return res.json({
        periodo: {
          inicio: fechaInicio.toISOString().slice(0, 10),
          fin: fechaFin.toISOString().slice(0, 10),
          etiqueta: etiquetaPeriodo
        },

        periodoDeuda: mesesDeuda.length === 1
          ? mesesDeuda[0]
          : null,

        casasActivas,

        deudasPendientes: deudasPendientesLista.length,

        totalPendiente,

        deudasPendientesPeriodo,

        totalPendientePeriodo,

        deudasPorServicio,

        pagosPeriodo: pagosPeriodo.length,

        recaudadoPeriodo,

        coberturaPorMes,

        recaudacionPorDia
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        mensaje:
          "Error al generar dashboard"
      });

    }

  };

module.exports = {
  estadoCuenta,
  deudasPendientes,
  recaudacionMensual,
  pagosPorFecha,
  recibosAnulados,
  dashboard
};