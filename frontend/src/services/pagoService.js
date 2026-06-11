import { apiFetch } from '../lib/api'

export function registrarPago(token, payload) {
  return apiFetch('/pagos', {
    token,
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
