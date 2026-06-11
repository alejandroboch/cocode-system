import { apiFetch } from '../lib/api'

export function listarServicios(token) {
  return apiFetch('/servicios', { token })
}

export function crearServicio(token, data) {
  return apiFetch('/servicios', {
    token,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function editarServicio(token, id, data) {
  return apiFetch(`/servicios/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function eliminarServicio(token, id) {
  return apiFetch(`/servicios/${id}`, {
    token,
    method: 'DELETE',
  })
}
