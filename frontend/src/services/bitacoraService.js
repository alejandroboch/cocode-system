import { apiFetch } from '../lib/api'

export function listarBitacora(token, params = {}) {
  const search = new URLSearchParams()

  if (params.usuarioId) search.set('usuarioId', String(params.usuarioId))
  if (params.modulo) search.set('modulo', params.modulo)
  if (params.accion) search.set('accion', params.accion)
  if (params.desde) search.set('desde', params.desde)
  if (params.hasta) search.set('hasta', params.hasta)
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))

  const query = search.toString()
  return apiFetch(`/bitacora${query ? `?${query}` : ''}`, { token })
}

export function opcionesFiltroBitacora(token) {
  return apiFetch('/bitacora/opciones', { token })
}
