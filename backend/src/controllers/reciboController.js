const prisma = require("../config/prisma");

const obtenerRecibo = async (req, res) => {

  try {

    const { numeroRecibo } = req.params;

    const recibo = await prisma.recibo.findUnique({
      where: {
        numeroRecibo
      },
      include: {
        pago: {
          include: {
            usuario: true,
            deuda: {
              include: {
                casa: true,
                servicio: true
              }
            }
          }
        }
      }
    });

    if (!recibo) {
      return res.status(404).json({
        mensaje: "Recibo no encontrado"
      });
    }

    const deuda = recibo.pago.deuda;

    return res.json({
      numeroRecibo: recibo.numeroRecibo,
      fecha: recibo.createdAt,

      estado: recibo.estado,

      casa: {
        codigoCasa: deuda.casa.codigoCasa,
        propietario: deuda.casa.propietarioActual,
        direccion: deuda.casa.direccion
      },

      servicio: deuda.servicio.nombre,

      periodo: {
        mes: deuda.mes,
        anio: deuda.anio
      },

      detallePago: {
        montoDeuda: Number(deuda.monto),
        mora: Number(deuda.mora),
        saldoAplicado: Number(recibo.pago.saldoAplicado),
        efectivoRecibido: Number(recibo.pago.montoPagado),
        totalCancelado: Number(recibo.pago.montoDeuda)
      },

      usuario: recibo.pago.usuario.nombre
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
          pago: {
            deuda: {
              casa: {
                codigoCasa: Number(codigoCasa)
              }
            }
          }
        },
        include: {
          pago: {
            include: {
              deuda: {
                include: {
                  servicio: true,
                  casa: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });
  
      return res.json(
        recibos.map((recibo) => ({
          numeroRecibo: recibo.numeroRecibo,
  
          estado: recibo.estado,
  
          fecha: recibo.createdAt,
  
          servicio:
            recibo.pago.deuda.servicio.nombre,
  
          mes:
            recibo.pago.deuda.mes,
  
          anio:
            recibo.pago.deuda.anio,
  
          total:
            Number(recibo.pago.montoDeuda)
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
            pago: {
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
  
        const deuda = recibo.pago.deuda;
  
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
  
        await tx.deuda.update({
          where: {
            id: deuda.id
          },
          data: {
            estado: "PENDIENTE"
          }
        });
  
        const saldoActual = await tx.saldoFavor.findUnique({
          where: {
            casaId_servicioId: {
              casaId: deuda.casaId,
              servicioId: deuda.servicioId
            }
          }
        });
  
        const saldoActualMonto =
          saldoActual
            ? Number(saldoActual.monto)
            : 0;
  
        const saldoRestaurado =
          saldoActualMonto
          - Number(recibo.pago.saldoGenerado)
          + Number(recibo.pago.saldoAplicado);
  
        if (saldoRestaurado > 0) {
  
          if (saldoActual) {
  
            await tx.saldoFavor.update({
              where: {
                casaId_servicioId: {
                  casaId: deuda.casaId,
                  servicioId: deuda.servicioId
                }
              },
              data: {
                monto: saldoRestaurado
              }
            });
  
          } else {
  
            await tx.saldoFavor.create({
              data: {
                casaId: deuda.casaId,
                servicioId: deuda.servicioId,
                monto: saldoRestaurado,
                observacion: "Restaurado por anulación"
              }
            });
  
          }
  
        } else {
  
          if (saldoActual) {
  
            await tx.saldoFavor.delete({
              where: {
                casaId_servicioId: {
                  casaId: deuda.casaId,
                  servicioId: deuda.servicioId
                }
              }
            });
  
          }
  
        }
  
        await tx.bitacora.create({
          data: {
            usuarioId,
            modulo: "RECIBOS",
            accion: "ANULAR",
            descripcion:
              `Recibo anulado ${numeroRecibo}`
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
  obtenerRecibo,
  obtenerRecibosPorCasa,
  anularRecibo
};