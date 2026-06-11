import { apiFetch } from '../lib/api'

export function listarTarifas(token) {
  return apiFetch('/tarifas-especiales', { token })
}

export function crearTarifa(token, data) {
  return apiFetch('/tarifas-especiales', {
    token,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function desactivarTarifa(token, id) {
  return apiFetch(`/tarifas-especiales/${id}/desactivar`, {
    token,
    method: 'PUT',
  })
}
