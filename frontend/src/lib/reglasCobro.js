export const TARIFA_AUTO = 25
export const TARIFA_MOTO = 15
export const MESES_COBRO_VEHICULAR = [6, 12]
export const DIA_INICIO_MORA = 6

function normalizarNombreServicio(nombre) {
  return String(nombre || '').trim().toUpperCase()
}

export function esServicioSeguridad(nombre) {
  return normalizarNombreServicio(nombre).includes('SEGURIDAD')
}

export function esServicioAgua(nombre) {
  return normalizarNombreServicio(nombre).includes('AGUA')
}

export function esMesCobroVehicular(mes) {
  return MESES_COBRO_VEHICULAR.includes(Number(mes))
}

export function puedeAplicarMora(
  nombreServicio,
  anio,
  mes,
  fechaReferencia = new Date(),
) {
  if (!esServicioSeguridad(nombreServicio)) {
    return false
  }

  const inicioMora = new Date(Number(anio), Number(mes) - 1, DIA_INICIO_MORA)
  inicioMora.setHours(0, 0, 0, 0)

  const hoy = new Date(fechaReferencia)
  hoy.setHours(0, 0, 0, 0)

  return hoy >= inicioMora
}

export function textoCobroVehicular() {
  return `En junio y diciembre se suma al cobro de seguridad y mantenimiento: Q${TARIFA_MOTO} por moto y Q${TARIFA_AUTO} por auto registrados en la casa.`
}

export function textoReglaMora() {
  return `La mora en seguridad y mantenimiento se aplica automáticamente a partir del día ${DIA_INICIO_MORA} de cada mes. En agua no hay mora. Al cobrar puede eximirse indicando el motivo.`
}
