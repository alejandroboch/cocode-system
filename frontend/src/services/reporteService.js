import { apiFetch } from '../lib/api'

export function estadoCuenta(token, codigoCasa) {
  return apiFetch(`/reportes/estado-cuenta/${codigoCasa}`, { token })
}

export function obtenerDashboard(token, params = {}) {
  const search = new URLSearchParams()

  if (params.inicio && params.fin) {
    search.set('inicio', params.inicio)
    search.set('fin', params.fin)
  } else if (params.mes && params.anio) {
    search.set('mes', String(params.mes))
    search.set('anio', String(params.anio))
  }

  const query = search.toString()
  return apiFetch(`/reportes/dashboard${query ? `?${query}` : ''}`, { token })
}

export function pagosPorFecha(token, { inicio, fin }) {
  const params = new URLSearchParams({
    inicio,
    fin,
  })
  return apiFetch(`/reportes/pagos?${params}`, { token })
}

export function recibosAnuladosPorFecha(token, { inicio, fin }) {
  const params = new URLSearchParams({
    inicio,
    fin,
  })
  return apiFetch(`/reportes/recibos-anulados?${params}`, { token })
}

export function listarDeudasPendientesReporte(token) {
  return apiFetch('/reportes/deudas-pendientes', { token })
}
