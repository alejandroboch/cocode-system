export function hoyIso() {
  return new Date().toISOString().slice(0, 10)
}

export function haceDiasIso(dias) {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return d.toISOString().slice(0, 10)
}

export function inicioMesActualIso() {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
}

export const PERIODOS_REPORTE = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7d', label: '7 días' },
  { id: 'mes', label: 'Mes actual' },
  { id: 'custom', label: 'Fechas específicas' },
]

export function calcularRangoPeriodo(periodoId, desde, hasta) {
  const fin = hoyIso()

  switch (periodoId) {
    case 'hoy':
      return { inicio: fin, fin, etiqueta: 'Hoy' }
    case '7d':
      return {
        inicio: haceDiasIso(6),
        fin,
        etiqueta: 'Últimos 7 días',
      }
    case 'mes':
      return {
        inicio: inicioMesActualIso(),
        fin,
        etiqueta: 'Mes actual',
      }
    case 'custom':
      return {
        inicio: desde,
        fin: hasta,
        etiqueta: desde && hasta ? `${desde} — ${hasta}` : 'Rango personalizado',
      }
    default:
      return { inicio: fin, fin, etiqueta: 'Hoy' }
  }
}

export function formatFechaReporte(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-GT', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function formatFechaCorta(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-GT', {
    dateStyle: 'medium',
  })
}
