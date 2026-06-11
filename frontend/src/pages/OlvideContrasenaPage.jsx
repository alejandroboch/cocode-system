import { useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitarRestablecimiento } from '../services/authService'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName } from '../components/ui/FormField'

export default function OlvideContrasenaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [avisoCorreo, setAvisoCorreo] = useState('')
  const [enlaceDesarrollo, setEnlaceDesarrollo] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMensaje('')
    setAvisoCorreo('')
    setEnlaceDesarrollo('')

    try {
      const data = await solicitarRestablecimiento(email.trim())
      setMensaje(data.mensaje)
      if (data.correoSimulado && data.aviso) {
        setAvisoCorreo(data.aviso)
      }
      if (data.enlaceDesarrollo) {
        setEnlaceDesarrollo(data.enlaceDesarrollo)
      }
    } catch (err) {
      setError(err.message ?? 'No se pudo procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-mesh flex min-h-svh items-center justify-center px-4 py-10">
      <div className="login-glass w-full max-w-md rounded-2xl p-8">
        <h1 className="text-xl font-bold text-cocode-heading">
          Restablecer contraseña
        </h1>
        <p className="mt-2 text-sm text-cocode-text/80">
          Ingresa el correo registrado en tu cuenta. Te enviaremos un enlace
          para crear una nueva contraseña.
        </p>

        {error && (
          <Alert type="error" className="mt-4" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {mensaje && (
          <Alert type="success" className="mt-4" onClose={() => setMensaje('')}>
            {mensaje}
          </Alert>
        )}
        {avisoCorreo && (
          <Alert type="warning" className="mt-4" onClose={() => setAvisoCorreo('')}>
            <p>{avisoCorreo}</p>
            {enlaceDesarrollo && (
              <a
                href={enlaceDesarrollo}
                className="mt-3 inline-block font-medium text-cocode-mint-deep underline"
              >
                Abrir enlace para restablecer contraseña
              </a>
            )}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormField label="Correo electrónico" id="email">
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClassName}
              placeholder="tu@correo.com"
            />
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </form>

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
