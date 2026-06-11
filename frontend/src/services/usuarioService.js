import { apiFetch } from '../lib/api'

export function listarRoles(token) {
  return apiFetch('/usuarios/roles', { token })
}

export function listarUsuarios(token) {
  return apiFetch('/usuarios', { token })
}

export function crearUsuario(token, data) {
  return apiFetch('/usuarios', {
    token,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function editarUsuario(token, id, data) {
  return apiFetch(`/usuarios/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
