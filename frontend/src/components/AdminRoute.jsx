import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { isAuthenticated, usuario } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (usuario?.rol !== 'ADMINISTRADOR') {
    return <Navigate to="/" replace />
  }

  return children
}
