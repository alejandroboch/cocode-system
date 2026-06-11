export const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

export function nombreMes(mes) {
  return MESES.find((m) => m.value === Number(mes))?.label ?? mes
}

export function formatPeriodo(mes, anio) {
  return `${nombreMes(mes)} ${anio}`
}

export function formatQuetzales(valor) {
  const num = Number(valor)
  if (Number.isNaN(num)) return 'Q0.00'
  return `Q${num.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatEntero(valor) {
  const num = Number(valor)
  if (Number.isNaN(num)) return '0'
  return num.toLocaleString('es-GT')
}

export function totalDeuda(deuda) {
  if (deuda.total !== undefined && deuda.total !== null) {
    return Number(deuda.total)
  }
  return Number(deuda.monto) + Number(deuda.mora)
}
