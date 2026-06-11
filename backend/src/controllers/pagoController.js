const prisma = require("../config/prisma");
const {
  esServicioAgua,
  esServicioSeguridad,
  puedeAplicarMora,
  obtenerMoraDefecto,
  resolverMoraCobro,
  formatearPlacasParaRecibo,
  combinarObservacionesRecibo
} = require("../lib/reglasCobro");

function ordenarDeudas(deudas) {
  return [...deudas].sort(
    (a, b) => a.anio - b.anio || a.mes - b.mes
  );
}

function mapaExencionesMora(body, deudaIds) {
  const mapa = new Map();

  if (Array.isArray(body.exencionesMora)) {
    for (const item of body.exencionesMora) {
      const id = Number(item.deudaId);

      if (deudaIds.includes(id)) {
        mapa.set(id, String(item.motivo || "").trim());
      }
    }
  }

  if (
    deudaIds.length === 1 &&
    body.eximirMora === true
  ) {
    mapa.set(
      deudaIds[0],
      String(body.motivoExencionMora || "").trim()
    );
  }

  return mapa;
}

const registrarPago = async (req, res) => {

  try {

    const {
      deudaId,
      deudaIds,
      montoRecibido,
      observaciones
    } = req.body;

    const usuarioId = req.user.id;

    const idsSolicitados = Array.isArray(deudaIds) && deudaIds.length
      ? deudaIds.map(Number)
      : deudaId
        ? [Number(deudaId)]
        : [];

    if (!idsSolicitados.length) {
      return res.status(400).json({
        mensaje: "Debe indicar al menos una deuda a cobrar"
      });
    }

    const exenciones = mapaExencionesMora(
      req.body,
      idsSolicitados
    );

    for (const motivo of exenciones.values()) {
      if (!motivo) {
        return res.status(400).json({
          mensaje:
            "Debe indicar el motivo para eximir la mora en cada periodo"
        });
      }
    }

    const resultado = await prisma.$transaction(async (tx) => {

      const deudas = await tx.deuda.findMany({
        where: {
          id: {
            in: idsSolicitados
          },
          estado: "PENDIENTE"
        },
        include: {
          casa: true,
          servicio: true
        }
      });

      if (deudas.length !== idsSolicitados.length) {
        throw new Error(
          "Una o más deudas no existen o ya fueron pagadas"
        );
      }

      const servicioIds = new Set(
        deudas.map((deuda) => deuda.servicioId)
      );

      if (servicioIds.size > 1) {
        throw new Error(
          "Todas las deudas del recibo deben ser del mismo servicio"
        );
      }

      const casaIds = new Set(
        deudas.map((deuda) => deuda.casaId)
      );

      if (casaIds.size > 1) {
        throw new Error(
          "Todas las deudas del recibo deben ser de la misma casa"
        );
      }

      const moraDefecto = await obtenerMoraDefecto(tx);
      const deudasOrdenadas = ordenarDeudas(deudas);
      const lineas = [];
      let totalMontoBase = 0;
      let totalMora = 0;

      for (const deuda of deudasOrdenadas) {
        const eximir = exenciones.has(deuda.id);
        const moraFinal = resolverMoraCobro(
          deuda,
          deuda.servicio.nombre,
          moraDefecto,
          eximir
        );

        if (
          esServicioAgua(deuda.servicio.nombre) &&
          moraFinal > 0
        ) {
          throw new Error(
            "El servicio de agua no aplica mora"
          );
        }

        if (
          moraFinal > 0 &&
          !puedeAplicarMora(
            deuda.servicio.nombre,
            deuda.anio,
            deuda.mes
          )
        ) {
          throw new Error(
            "La mora en seguridad y mantenimiento solo aplica a partir del día 6 del mes"
          );
        }

        if (moraFinal !== Number(deuda.mora ?? 0)) {
          await tx.deuda.update({
            where: {
              id: deuda.id
            },
            data: {
              mora: moraFinal
            }
          });
        }

        const montoBase = Number(deuda.monto);
        const totalLinea = montoBase + moraFinal;

        totalMontoBase += montoBase;
        totalMora += moraFinal;

        lineas.push({
          deuda,
          moraFinal,
          totalLinea,
          eximir
        });
      }

      const totalDeuda = totalMontoBase + totalMora;
      const recibido = Number(montoRecibido);

      if (Number.isNaN(recibido) || recibido < 0) {
        throw new Error("El monto recibido no es válido");
      }

      if (recibido < totalDeuda) {
        throw new Error(
          `Monto insuficiente. Faltan Q${(
            totalDeuda - recibido
          ).toFixed(2)}`
        );
      }

      const primera = deudasOrdenadas[0];
      const correlativo =
        await tx.correlativoRecibo.findUnique({
          where: {
            servicioId: primera.servicioId
          }
        });

      const siguienteNumero =
        correlativo.ultimoNumero + 1;

      await tx.correlativoRecibo.update({
        where: {
          servicioId: primera.servicioId
        },
        data: {
          ultimoNumero: siguienteNumero
        }
      });

      const numeroRecibo =
        `${correlativo.prefijo}-${String(
          siguienteNumero
        ).padStart(6, "0")}`;

      const partesObservacion = [];

      for (const linea of lineas) {
        if (linea.eximir) {
          const motivo = exenciones.get(linea.deuda.id);
          partesObservacion.push(
            `Mora eximida ${linea.deuda.mes}/${linea.deuda.anio}: ${motivo}`
          );
        }
      }

      if (
        typeof observaciones === "string" &&
        observaciones.trim()
      ) {
        partesObservacion.push(observaciones.trim());
      }

      let observacionesRecibo = partesObservacion.length
        ? partesObservacion.join("\n").slice(0, 500)
        : null;

      if (esServicioSeguridad(primera.servicio.nombre)) {
        const placas = await tx.placaCasa.findMany({
          where: {
            casaId: primera.casaId
          },
          orderBy: [
            { tipo: "asc" },
            { placa: "asc" }
          ]
        });

        observacionesRecibo = combinarObservacionesRecibo(
          observacionesRecibo,
          formatearPlacasParaRecibo(placas)
        );
      }

      const recibo = await tx.recibo.create({
        data: {
          numeroRecibo,
          casaId: primera.casaId,
          servicioId: primera.servicioId,
          usuarioId,
          montoTotal: totalDeuda,
          montoPagado: recibido,
          observaciones: observacionesRecibo
        }
      });

      for (const linea of lineas) {
        await tx.deuda.update({
          where: {
            id: linea.deuda.id
          },
          data: {
            estado: "PAGADA"
          }
        });

        await tx.pago.create({
          data: {
            deudaId: linea.deuda.id,
            reciboId: recibo.id,
            usuarioId,
            montoDeuda: linea.totalLinea
          }
        });
      }

      await tx.bitacora.create({
        data: {
          usuarioId,
          modulo: "PAGOS",
          accion: "REGISTRAR",
          descripcion:
            lineas.length > 1
              ? `Pago ${numeroRecibo} — ${lineas.length} periodos`
              : exenciones.size > 0
                ? `Pago ${numeroRecibo} — mora eximida`
                : `Pago registrado ${numeroRecibo}`
        }
      });

      return {
        recibo,
        cambio: recibido - totalDeuda,
        periodos: lineas.length
      };

    });

    return res.status(201).json({
      mensaje:
        resultado.periodos > 1
          ? `Pago registrado — ${resultado.periodos} meses en un recibo`
          : "Pago registrado correctamente",
      numeroRecibo: resultado.recibo.numeroRecibo,
      cambio: resultado.cambio,
      periodos: resultado.periodos
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
