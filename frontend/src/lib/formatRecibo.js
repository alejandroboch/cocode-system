const DIAS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
]

const MESES_LARGO = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export function formatFechaRecibo(fechaIso) {
  const d = new Date(fechaIso)
  const dia = DIAS[d.getDay()]
  const num = d.getDate()
  const mes = MESES_LARGO[d.getMonth()]
  const anio = d.getFullYear()
  return `${dia}, ${num} de ${mes} de ${anio}`
}

export function formatMontoRecibo(valor) {
  const num = Number(valor)
  if (Number.isNaN(num)) return '0,00'
  return num.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatCobrador(cobrador) {
  if (!cobrador) return '—'
  const partes = cobrador.nombre.trim().split(/\s+/)
  const inicial =
    partes.length > 1
      ? `${partes[0].charAt(0)}`.toUpperCase()
      : partes[0].charAt(0).toUpperCase()
  const apellido =
    partes.length > 1
      ? partes[partes.length - 1].toUpperCase()
      : partes[0].toUpperCase()
  return `${cobrador.id}-${inicial} ${apellido}`
}

export function descripcionItem(item, servicioFallback) {
  if (!item) return servicioFallback ?? '—'
  const desc = item.descripcion ?? servicioFallback ?? ''
  return `${item.codigo}-${desc}`.toUpperCase()
}
