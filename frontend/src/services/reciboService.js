import { apiFetch } from '../lib/api'

export function listarRecibos(token, params = {}) {
  const search = new URLSearchParams()
  if (params.estado) search.set('estado', params.estado)
  if (params.q) search.set('q', params.q)
  const query = search.toString()
  return apiFetch(`/recibos${query ? `?${query}` : ''}`, { token })
}

export function obtenerRecibo(token, numeroRecibo) {
  return apiFetch(`/recibos/${numeroRecibo}`, { token })
}

export function anularRecibo(token, numeroRecibo, motivo) {
  return apiFetch(`/recibos/anular/${numeroRecibo}`, {
    token,
    method: 'PUT',
    body: JSON.stringify({ motivo }),
  })
}
