import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  restablecerContrasena,
  validarTokenRestablecimiento,
} from '../services/authService'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName } from '../components/ui/FormField'

export default function RestablecerContrasenaPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [validando, setValidando] = useState(true)
  const [tokenValido, setTokenValido] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (!token) {
      setValidando(false)
      setTokenValido(false)
      setError('El enlace no es válido')
      return
    }

    validarTokenRestablecimiento(token)
      .then((data) => {
        setTokenValido(Boolean(data.valido))
        setEmail(data.email ?? '')
      })
      .catch((err) => {
        setTokenValido(false)
        setError(err.message ?? 'El enlace expiró o no es válido')
      })
      .finally(() => setValidando(false))
  }, [token])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMensaje('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const data = await restablecerContrasena(token, password)
      setMensaje(data.mensaje)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      setError(err.message ?? 'No se pudo actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-mesh flex min-h-svh items-center justify-center px-4 py-10">
      <div className="login-glass w-full max-w-md rounded-2xl p-8">
        <h1 className="text-xl font-bold text-cocode-heading">
          Nueva contraseña
        </h1>

        {validando ? (
          <p className="mt-4 text-sm text-cocode-text/70">Validando enlace…</p>
        ) : !tokenValido ? (
          <>
            {error && (
              <Alert type="error" className="mt-4">
                {error}
              </Alert>
            )}
            <p className="mt-6 text-center text-sm">
              <Link
                to="/olvide-contrasena"
                className="font-medium text-cocode-mint-deep hover:underline"
              >
                Solicitar un nuevo enlace
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-cocode-text/80">
              Cuenta: <strong>{email}</strong>
            </p>

            {error && (
              <Alert type="error" className="mt-4" onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {mensaje && (
              <Alert type="success" className="mt-4">
                {mensaje}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <FormField label="Nueva contraseña" id="password">
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClassName}
                />
              </FormField>

              <FormField label="Confirmar contraseña" id="confirmPassword">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClassName}
                />
              </FormField>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Guardando…' : 'Guardar contraseña'}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm">
          <Link
            to="/login"
            className="font-medium text-cocode-mint-deep hover:underline"
          >
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
