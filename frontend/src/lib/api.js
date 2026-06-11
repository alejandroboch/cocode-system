const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export function getApiBase() {
  return API_BASE
}

export async function apiFetch(path, options = {}) {
  const { token, ...fetchOptions } = options
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  })

  let data = null
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    data = await response.json()
  }

  if (!response.ok) {
    const error = new Error(data?.mensaje ?? 'Error en la solicitud')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
