import { apiFetch } from '../lib/api'

export function generarDeudas(token, { anio, mes, servicioIds }) {
  return apiFetch('/deudas/generar', {
    token,
    method: 'POST',
    body: JSON.stringify({ anio, mes, servicioIds }),
  })
}

export function resumenPeriodoDeudas(token, { anio, mes }) {
  const params = new URLSearchParams({
    anio: String(anio),
    mes: String(mes),
  })
  return apiFetch(`/deudas/resumen-periodo?${params}`, { token })
}

export function eliminarGeneracionMes(token, { anio, mes, servicioIds }) {
  return apiFetch('/deudas/eliminar-generacion', {
    token,
    method: 'POST',
    body: JSON.stringify({ anio, mes, servicioIds }),
  })
}

export function obtenerDeudasCasa(token, casaId) {
  return apiFetch(`/deudas/casa/${casaId}`, { token })
}

export function listarDeudasPendientes(token) {
  return apiFetch('/reportes/deudas-pendientes', { token })
}

export function crearCobroExtra(
  token,
  { casaId, servicioId, anio, mes, monto, observaciones },
) {
  return apiFetch('/deudas/cobro-extra', {
    token,
    method: 'POST',
    body: JSON.stringify({
      casaId,
      servicioId,
      anio,
      mes,
      monto,
      observaciones,
    }),
  })
}

export function listarCobrosExtra(token, { estado, casaId } = {}) {
  const params = new URLSearchParams()
  if (estado) params.set('estado', estado)
  if (casaId) params.set('casaId', String(casaId))
  const query = params.toString()
  return apiFetch(`/deudas/cobros-extra${query ? `?${query}` : ''}`, { token })
}

export function eliminarCobroExtra(token, id) {
  return apiFetch(`/deudas/cobro-extra/${id}`, {
    token,
    method: 'DELETE',
  })
}
