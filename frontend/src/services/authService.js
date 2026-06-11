import { apiFetch } from '../lib/api'

export async function login(usuario, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, password }),
  })
}

export async function cerrarSesion(token) {
  return apiFetch('/auth/logout', {
    token,
    method: 'POST',
  })
}

export function obtenerPerfil(token) {
  return apiFetch('/auth/perfil', { token })
}

export function solicitarRestablecimiento(email) {
  return apiFetch('/auth/solicitar-restablecimiento', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function validarTokenRestablecimiento(token) {
  return apiFetch(`/auth/validar-token/${encodeURIComponent(token)}`)
}

export function restablecerContrasena(token, password) {
  return apiFetch('/auth/restablecer-contrasena', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}
