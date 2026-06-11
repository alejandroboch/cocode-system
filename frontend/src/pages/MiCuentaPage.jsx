import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  obtenerPerfil,
  solicitarRestablecimiento,
} from '../services/authService'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'

export default function MiCuentaPage() {
  const { token } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [avisoCorreo, setAvisoCorreo] = useState('')
  const [enlaceDesarrollo, setEnlaceDesarrollo] = useState('')

  const cargarPerfil = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await obtenerPerfil(token)
      setPerfil(data)
    } catch (err) {
      setError(err.message ?? 'No se pudo cargar tu perfil')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    cargarPerfil()
  }, [cargarPerfil])

  async function handleSolicitarEnlace(event) {
    event.preventDefault()
    if (!perfil?.email) return

    setEnviando(true)
    setMensaje('')
    setAvisoCorreo('')
    setEnlaceDesarrollo('')
    setError('')

    try {
      const data = await solicitarRestablecimiento(perfil.email)
      setMensaje(data.mensaje)
      if (data.correoSimulado && data.aviso) {
        setAvisoCorreo(data.aviso)
      } else if (data.destinatario) {
        setMensaje(
          `Correo enviado a ${data.destinatario}. Revise bandeja de entrada y spam.`,
        )
      }
      if (data.enlaceDesarrollo) {
        setEnlaceDesarrollo(data.enlaceDesarrollo)
      }
    } catch (err) {
      setError(err.message ?? 'No se pudo enviar el correo')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Mi cuenta"
        description="Datos de acceso y cambio de contraseña por correo electrónico"
      />

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {mensaje && (
        <Alert type="success" className="mb-6" onClose={() => setMensaje('')}>
          {mensaje}
        </Alert>
      )}
      {avisoCorreo && (
        <Alert type="warning" className="mb-6" onClose={() => setAvisoCorreo('')}>
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

      {loading ? (
        <div className="surface-card h-48 animate-pulse bg-slate-50" />
      ) : perfil ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="surface-card p-6">
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Datos de la cuenta
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-cocode-text/60">Nombre</dt>
                <dd className="font-medium text-cocode-heading">{perfil.nombre}</dd>
              </div>
              <div>
                <dt className="text-cocode-text/60">Usuario</dt>
                <dd className="font-medium text-cocode-heading">{perfil.usuario}</dd>
              </div>
              <div>
                <dt className="text-cocode-text/60">Correo registrado</dt>
                <dd className="font-medium text-cocode-heading">{perfil.email}</dd>
              </div>
              <div>
                <dt className="text-cocode-text/60">Rol</dt>
                <dd className="font-medium text-cocode-heading">{perfil.rol}</dd>
              </div>
            </dl>
          </article>

          <article className="surface-card p-6">
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Cambiar contraseña
            </h2>
            <p className="mt-3 text-sm text-cocode-text/80">
              El enlace se envía al <strong>correo registrado de tu usuario</strong>{' '}
              ({perfil.email}). El sistema usa una sola cuenta de correo del COCODE
              para enviar; no necesitas configurar nada personal, solo que tu correo
              en el sistema sea el correcto.
            </p>
            <form onSubmit={handleSolicitarEnlace} className="mt-5">
              <Button type="submit" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar enlace a mi correo'}
              </Button>
            </form>
            <p className="mt-4 text-xs text-cocode-text/60">
              El enlace expira en 1 hora. Si no lo recibes, revisa la carpeta
              de spam o contacta al administrador.
            </p>
          </article>
        </div>
      ) : null}
    </>
  )
}
