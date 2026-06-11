import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { cerrarSesion } from '../services/authService'

const STORAGE_TOKEN = 'cocode_token'
const STORAGE_USER = 'cocode_usuario'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    sessionStorage.getItem(STORAGE_TOKEN),
  )
  const [usuario, setUsuario] = useState(readStoredUser)

  useEffect(() => {
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_USER)
  }, [])

  const login = useCallback((payload) => {
    sessionStorage.setItem(STORAGE_TOKEN, payload.token)
    sessionStorage.setItem(STORAGE_USER, JSON.stringify(payload.usuario))
    setToken(payload.token)
    setUsuario(payload.usuario)
  }, [])

  const logout = useCallback(async () => {
    const currentToken = sessionStorage.getItem(STORAGE_TOKEN)

    if (currentToken) {
      try {
        await cerrarSesion(currentToken)
      } catch {
        // Si falla la red, igual se limpia la sesión local
      }
    }

    sessionStorage.removeItem(STORAGE_TOKEN)
    sessionStorage.removeItem(STORAGE_USER)
    setToken(null)
    setUsuario(null)
  }, [])

  const value = useMemo(
    () => ({
      token,
      usuario,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, usuario, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
