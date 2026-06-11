import { apiFetch } from '../lib/api'

export function obtenerConfiguracion(token) {
  return apiFetch('/configuracion', { token })
}
