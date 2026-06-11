const TARIFA_AUTO = 25;
const TARIFA_MOTO = 15;
const MESES_COBRO_VEHICULAR = [6, 12];
const DIA_INICIO_MORA = 6;

function normalizarNombreServicio(nombre) {
  return String(nombre || "").trim().toUpperCase();
}

function esServicioSeguridad(nombre) {
  return normalizarNombreServicio(nombre).includes("SEGURIDAD");
}

function esServicioAgua(nombre) {
  return normalizarNombreServicio(nombre).includes("AGUA");
}

function esMesCobroVehicular(mes) {
  return MESES_COBRO_VEHICULAR.includes(Number(mes));
}

function calcularCargoVehicular(conteo) {
  const autos = conteo?.auto ?? 0;
  const motos = conteo?.moto ?? 0;
  return autos * TARIFA_AUTO + motos * TARIFA_MOTO;
}

function construirConteoPlacasPorCasa(placas) {
  const mapa = new Map();

  for (const placa of placas) {
    if (!mapa.has(placa.casaId)) {
      mapa.set(placa.casaId, { auto: 0, moto: 0 });
    }

    const conteo = mapa.get(placa.casaId);

    if (placa.tipo === "AUTO") {
      conteo.auto++;
    } else if (placa.tipo === "MOTO") {
      conteo.moto++;
    }
  }

  return mapa;
}

function puedeAplicarMora(
  nombreServicio,
  anio,
  mes,
  fechaReferencia = new Date()
) {
  if (!esServicioSeguridad(nombreServicio)) {
    return false;
  }

  const inicioMora = new Date(
    Number(anio),
    Number(mes) - 1,
    DIA_INICIO_MORA
  );
  inicioMora.setHours(0, 0, 0, 0);

  const hoy = new Date(fechaReferencia);
  hoy.setHours(0, 0, 0, 0);

  return hoy >= inicioMora;
}

function calcularMoraEfectiva(
  deuda,
  nombreServicio,
  moraDefecto,
  fechaReferencia = new Date()
) {
  const moraGuardada = Number(deuda.mora ?? 0);

  if (deuda.estado === "PAGADA") {
    return moraGuardada;
  }

  if (moraGuardada > 0) {
    return moraGuardada;
  }

  return calcularMoraSugerida(
    deuda,
    nombreServicio,
    moraDefecto,
    fechaReferencia
  );
}

function calcularMoraSugerida(
  deuda,
  nombreServicio,
  moraDefecto,
  fechaReferencia = new Date()
) {
  if (deuda.estado === "PAGADA") {
    return 0;
  }

  if (
    puedeAplicarMora(
      nombreServicio,
      deuda.anio,
      deuda.mes,
      fechaReferencia
    )
  ) {
    return Number(moraDefecto) || 0;
  }

  return 0;
}

async function obtenerMoraDefecto(prisma) {
  const config = await prisma.configuracion.findFirst({
    orderBy: {
      id: "asc"
    }
  });

  return Number(config?.moraDefecto ?? 0);
}

function enriquecerDeudaParaRespuesta(
  deuda,
  moraDefecto,
  fechaReferencia = new Date()
) {
  const nombreServicio =
    deuda.servicio?.nombre ?? deuda.servicio ?? "";

  const permiteMora = esServicioSeguridad(nombreServicio);
  const moraEfectiva = calcularMoraEfectiva(
    deuda,
    nombreServicio,
    moraDefecto,
    fechaReferencia
  );

  const aplicaMoraPorFecha =
    deuda.estado === "PENDIENTE" &&
    permiteMora &&
    puedeAplicarMora(
      nombreServicio,
      deuda.anio,
      deuda.mes,
      fechaReferencia
    );

  const moraSugerida = aplicaMoraPorFecha
    ? Number(moraDefecto) || 0
    : 0;

  return {
    id: deuda.id,
    casaId: deuda.casaId,
    servicioId: deuda.servicioId,
    servicio: nombreServicio,
    mes: deuda.mes,
    anio: deuda.anio,
    monto: Number(deuda.monto),
    mora: moraEfectiva,
    moraSugerida,
    moraRegistrada: Number(deuda.mora ?? 0),
    aplicaMoraPorFecha,
    puedeAplicarMora: aplicaMoraPorFecha,
    moraConfigurada: Number(moraDefecto) > 0,
    permiteMora,
    estado: deuda.estado,
    esExtra: Boolean(deuda.esExtra),
    observaciones: deuda.observaciones ?? null,
    total: Number(deuda.monto) + moraEfectiva,
    createdAt: deuda.createdAt
  };
}

function sumarTotalDeuda(deuda, moraDefecto, fechaReferencia = new Date()) {
  const nombreServicio =
    deuda.servicio?.nombre ?? deuda.servicio ?? "";

  return (
    Number(deuda.monto) +
    calcularMoraEfectiva(
      deuda,
      nombreServicio,
      moraDefecto,
      fechaReferencia
    )
  );
}

function formatearPlacasParaRecibo(placas) {
  if (!Array.isArray(placas) || placas.length === 0) {
    return null;
  }

  const autos = placas
    .filter((item) => item.tipo === "AUTO")
    .map((item) => String(item.placa).trim().toUpperCase())
    .filter(Boolean);

  const motos = placas
    .filter((item) => item.tipo === "MOTO")
    .map((item) => String(item.placa).trim().toUpperCase())
    .filter(Boolean);

  const partes = [];

  if (autos.length) {
    partes.push(`Autos: ${autos.join(", ")}`);
  }

  if (motos.length) {
    partes.push(`Motos: ${motos.join(", ")}`);
  }

  return partes.length ? partes.join(" | ") : null;
}

function quitarObservacionesPlacas(texto) {
  if (!texto?.trim()) {
    return "";
  }

  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter(
      (linea) =>
        linea &&
        !linea.startsWith("Autos:") &&
        !linea.startsWith("Motos:")
    )
    .join("\n")
    .trim();
}

function combinarObservacionesRecibo(observacionesGuardadas, textoPlacas) {
  const partes = [];

  if (textoPlacas) {
    partes.push(textoPlacas);
  }

  const resto = quitarObservacionesPlacas(observacionesGuardadas);

  if (resto) {
    partes.push(resto);
  }

  return partes.length ? partes.join("\n").slice(0, 500) : null;
}

function resolverMoraCobro(
  deuda,
  nombreServicio,
  moraDefecto,
  eximirMora = false
) {
  if (eximirMora) {
    return 0;
  }

  if (
    esServicioAgua(nombreServicio)
  ) {
    return 0;
  }

  if (
    puedeAplicarMora(
      nombreServicio,
      deuda.anio,
      deuda.mes
    )
  ) {
    return Number(moraDefecto) || 0;
  }

  return 0;
}

module.exports = {
  TARIFA_AUTO,
  TARIFA_MOTO,
  MESES_COBRO_VEHICULAR,
  DIA_INICIO_MORA,
  esServicioSeguridad,
  esServicioAgua,
  esMesCobroVehicular,
  calcularCargoVehicular,
  construirConteoPlacasPorCasa,
  puedeAplicarMora,
  calcularMoraEfectiva,
  calcularMoraSugerida,
  obtenerMoraDefecto,
  enriquecerDeudaParaRespuesta,
  sumarTotalDeuda,
  resolverMoraCobro,
  formatearPlacasParaRecibo,
  combinarObservacionesRecibo
};
