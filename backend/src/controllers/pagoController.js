const prisma = require("../config/prisma");

const registrarPago = async (req, res) => {

  try {

    const {
      deudaId,
      montoRecibido
    } = req.body;

    const usuarioId = req.user.id;

    const resultado = await prisma.$transaction(async (tx) => {

      const deuda = await tx.deuda.findUnique({
        where: {
          id: Number(deudaId)
        },
        include: {
          casa: true,
          servicio: true
        }
      });

      if (!deuda) {
        throw new Error("Deuda no encontrada");
      }

      if (deuda.estado === "PAGADA") {
        throw new Error("La deuda ya fue pagada");
      }

      const saldoFavor = await tx.saldoFavor.findUnique({
        where: {
          casaId_servicioId: {
            casaId: deuda.casaId,
            servicioId: deuda.servicioId
          }
        }
      });

      const saldoDisponible = saldoFavor
        ? Number(saldoFavor.monto)
        : 0;

      const totalDeuda =
        Number(deuda.monto) +
        Number(deuda.mora);

      const totalDisponible =
        saldoDisponible +
        Number(montoRecibido);

      if (totalDisponible < totalDeuda) {
        throw new Error(
          `Monto insuficiente. Faltan Q${(
            totalDeuda - totalDisponible
          ).toFixed(2)}`
        );
      }

      const saldoAplicado =
        Math.min(saldoDisponible, totalDeuda);

      const nuevoSaldo =
        totalDisponible - totalDeuda;

      await tx.deuda.update({
        where: {
          id: deuda.id
        },
        data: {
          estado: "PAGADA"
        }
      });

      const pago = await tx.pago.create({
        data: {
          deudaId: deuda.id,
          usuarioId,
          montoPagado: Number(montoRecibido),
          montoDeuda: totalDeuda,
          saldoAplicado
        }
      });

      if (saldoFavor) {

        if (nuevoSaldo > 0) {

          await tx.saldoFavor.update({
            where: {
              casaId_servicioId: {
                casaId: deuda.casaId,
                servicioId: deuda.servicioId
              }
            },
            data: {
              monto: nuevoSaldo
            }
          });

        } else {

          await tx.saldoFavor.delete({
            where: {
              casaId_servicioId: {
                casaId: deuda.casaId,
                servicioId: deuda.servicioId
              }
            }
          });

        }

      } else {

        if (nuevoSaldo > 0) {

          await tx.saldoFavor.create({
            data: {
              casaId: deuda.casaId,
              servicioId: deuda.servicioId,
              monto: nuevoSaldo,
              observacion: "Saldo generado por excedente de pago"
            }
          });

        }

      }

      const correlativo =
        await tx.correlativoRecibo.findUnique({
          where: {
            servicioId: deuda.servicioId
          }
        });

      const siguienteNumero =
        correlativo.ultimoNumero + 1;

      await tx.correlativoRecibo.update({
        where: {
          servicioId: deuda.servicioId
        },
        data: {
          ultimoNumero: siguienteNumero
        }
      });

      const numeroRecibo =
        `${correlativo.prefijo}-${String(
          siguienteNumero
        ).padStart(6, "0")}`;

      const recibo = await tx.recibo.create({
        data: {
          pagoId: pago.id,
          numeroRecibo
        }
      });

      await tx.bitacora.create({
        data: {
          usuarioId,
          modulo: "PAGOS",
          accion: "REGISTRAR",
          descripcion:
            `Pago registrado ${numeroRecibo}`
        }
      });

      return {
        recibo,
        pago,
        deuda,
        saldoAplicado,
        nuevoSaldo
      };

    });

    return res.status(201).json({
      mensaje: "Pago registrado correctamente",
      numeroRecibo:
        resultado.recibo.numeroRecibo,
      saldoAplicado:
        resultado.saldoAplicado,
      saldoGenerado:
        resultado.nuevoSaldo
    });

  } catch (error) {

    console.error(error);

    return res.status(400).json({
      mensaje: error.message
    });

  }

};

module.exports = {
  registrarPago
};