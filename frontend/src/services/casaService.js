import { apiFetch } from '../lib/api'

export function listarCasas(token) {
  return apiFetch('/casas', { token })
}

export function buscarCasas(token, q) {
  return apiFetch(`/casas/buscar?q=${encodeURIComponent(q)}`, { token })
}

export function buscarCasaPorUbicacion(token, manzana, lote) {
  const params = new URLSearchParams({
    manzana: String(manzana).trim(),
    lote: String(lote).trim(),
  })
  return apiFetch(`/casas/ubicacion?${params}`, { token })
}

export function crearCasa(token, data) {
  return apiFetch('/casas', {
    token,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function editarCasa(token, id, data) {
  return apiFetch(`/casas/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function obtenerCasa(token, id) {
  return apiFetch(`/casas/${id}`, { token })
}

export function actualizarContactoCasa(token, id, data) {
  return apiFetch(`/casas/${id}/contacto`, {
    token,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function listarTelefonosCasas(token, q = '') {
  const params = q ? `?q=${encodeURIComponent(q)}` : ''
  return apiFetch(`/casas/telefonos${params}`, { token })
}

export function listarPlacasCasas(token, { q = '', tipo = '' } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (tipo) params.set('tipo', tipo)
  const query = params.toString()
  return apiFetch(`/casas/placas${query ? `?${query}` : ''}`, { token })
}
