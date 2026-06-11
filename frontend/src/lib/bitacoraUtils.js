export const MODULO_LABELS = {
  AUTH: 'Autenticación',
  CASAS: 'Casas',
  DEUDAS: 'Deudas',
  PAGOS: 'Pagos',
  RECIBOS: 'Recibos',
  SERVICIOS: 'Servicios',
  TARIFAS: 'Tarifas especiales',
  USUARIOS: 'Usuarios',
}

export const ACCION_LABELS = {
  ANULAR: 'Anulación',
  CREAR: 'Creación',
  DESACTIVAR: 'Desactivación',
  EDITAR: 'Edición',
  ELIMINAR: 'Eliminación',
  ELIMINAR_GENERACION: 'Revertir generación',
  GENERAR: 'Generación',
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  REGISTRAR: 'Registro',
}

export const ACCION_STYLES = {
  CREAR: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  EDITAR: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  ELIMINAR: 'bg-red-50 text-red-700 ring-red-200',
  DESACTIVAR: 'bg-amber-50 text-amber-800 ring-amber-200',
  GENERAR: 'bg-violet-50 text-violet-800 ring-violet-200',
  ELIMINAR_GENERACION: 'bg-orange-50 text-orange-800 ring-orange-200',
  REGISTRAR: 'bg-teal-50 text-teal-800 ring-teal-200',
  ANULAR: 'bg-red-50 text-red-700 ring-red-200',
  LOGIN: 'bg-slate-100 text-slate-700 ring-slate-300/50',
  LOGOUT: 'bg-slate-100 text-slate-600 ring-slate-300/50',
}

export function labelModulo(modulo) {
  return MODULO_LABELS[modulo] ?? modulo
}

export function labelAccion(accion) {
  return ACCION_LABELS[accion] ?? accion
}

export function formatFechaBitacora(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-GT', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

export function hoyIso() {
  return new Date().toISOString().slice(0, 10)
}

export function haceDiasIso(dias) {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return d.toISOString().slice(0, 10)
}
