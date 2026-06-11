import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  crearServicio,
  editarServicio,
  eliminarServicio,
  listarServicios,
} from '../services/servicioService'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName } from '../components/ui/FormField'

const servicioVacio = {
  nombre: '',
  montoBase: '',
  prefijo: '',
}

export default function ServiciosPage() {
  const { token, usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMINISTRADOR'

  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(servicioVacio)
  const [guardando, setGuardando] = useState(false)

  const [eliminarTarget, setEliminarTarget] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargarServicios = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listarServicios(token)
      setServicios(data)
    } catch (err) {
      setError(err.message ?? 'No se pudieron cargar los servicios')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    cargarServicios()
  }, [cargarServicios])

  function abrirCrear() {
    setEditando(null)
    setForm(servicioVacio)
    setMensaje('')
    setModalOpen(true)
  }

  function abrirEditar(servicio) {
    setEditando(servicio)
    setForm({
      nombre: servicio.nombre ?? '',
      montoBase: String(servicio.montoBase ?? ''),
      prefijo: servicio.correlativo?.prefijo ?? '',
    })
    setMensaje('')
    setModalOpen(true)
  }

  function cerrarModal() {
    setModalOpen(false)
    setEditando(null)
    setForm(servicioVacio)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setGuardando(true)
    setMensaje('')

    const payload = {
      nombre: form.nombre.trim(),
      montoBase: Number(form.montoBase),
      prefijo: form.prefijo.trim().toUpperCase(),
    }

    try {
      if (editando) {
        await editarServicio(token, editando.id, payload)
        setMensaje('Servicio actualizado correctamente')
      } else {
        await crearServicio(token, payload)
        setMensaje('Servicio creado correctamente')
      }
      cerrarModal()
      cargarServicios()
    } catch (err) {
      setMensaje(err.message ?? 'No se pudo guardar el servicio')
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar() {
    if (!eliminarTarget) return

    setEliminando(true)
    setErrorEliminar('')

    try {
      const data = await eliminarServicio(token, eliminarTarget.id)
      setMensaje(data.mensaje ?? 'Servicio eliminado correctamente')
      setEliminarTarget(null)
      cargarServicios()
    } catch (err) {
      setErrorEliminar(
        err.message ?? 'No se pudo eliminar el servicio',
      )
    } finally {
      setEliminando(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Servicios"
        description="Tarifas base y prefijos de recibo por servicio"
        action={
          esAdmin && (
            <Button onClick={abrirCrear}>+ Nuevo servicio</Button>
          )
        }
      />

      {mensaje && !modalOpen && !eliminarTarget && (
        <Alert type="success" className="mb-6" onClose={() => setMensaje('')}>
          {mensaje}
        </Alert>
      )}
      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full py-8 text-center text-sm text-cocode-text/70">
            Cargando servicios…
          </p>
        ) : servicios.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-cocode-text/70">
            No hay servicios registrados
          </p>
        ) : (
          servicios.map((servicio) => (
            <article
              key={servicio.id}
              className="surface-card border-l-4 border-l-teal-600 p-6"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-cocode-heading">
                  {servicio.nombre}
                </h3>
                {servicio.correlativo && (
                  <span className="rounded-full bg-cocode-gold/40 px-2.5 py-0.5 text-xs font-semibold text-cocode-heading">
                    {servicio.correlativo.prefijo}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm text-cocode-text/70">
                Tarifa base mensual
              </p>
              <p className="mt-1 text-3xl font-bold text-cocode-heading">
                Q{Number(servicio.montoBase).toFixed(2)}
              </p>
              {servicio.correlativo && (
                <p className="mt-3 text-xs text-cocode-text/60">
                  Recibos: {servicio.correlativo.prefijo}-######
                </p>
              )}
              {esAdmin && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => abrirEditar(servicio)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEliminarTarget(servicio)
                      setErrorEliminar('')
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editando ? 'Editar servicio' : 'Nuevo servicio'}
        onClose={cerrarModal}
      >
        {mensaje && modalOpen && (
          <Alert type="error" className="mb-4" onClose={() => setMensaje('')}>
            {mensaje}
          </Alert>
        )}

        {editando && (
          <p className="mb-4 text-xs text-cocode-text/65">
            La tarifa base aplica a las deudas que se generen después del
            cambio. Las deudas ya creadas conservan su monto.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Nombre del servicio"
            id="nombre"
            hint="Ej. AGUA, SEGURIDAD Y MANTENIMIENTO"
          >
            <input
              id="nombre"
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClassName}
              placeholder="Nombre del servicio"
            />
          </FormField>

          <FormField
            label="Tarifa base (Q)"
            id="montoBase"
            hint="Precio por defecto al generar deudas mensuales"
          >
            <input
              id="montoBase"
              type="number"
              required
              min="0"
              step="0.01"
              value={form.montoBase}
              onChange={(e) => setForm({ ...form, montoBase: e.target.value })}
              className={inputClassName}
              placeholder="100.00"
            />
          </FormField>

          <FormField
            label="Prefijo de recibo"
            id="prefijo"
            hint="Letra o código para numeración (ej. A, S). No reinicia el correlativo."
          >
            <input
              id="prefijo"
              type="text"
              required
              maxLength={5}
              value={form.prefijo}
              onChange={(e) => setForm({ ...form, prefijo: e.target.value })}
              className={inputClassName}
              placeholder="A"
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={guardando} className="flex-1">
              {guardando
                ? 'Guardando…'
                : editando
                  ? 'Guardar cambios'
                  : 'Registrar servicio'}
            </Button>
            <Button type="button" variant="secondary" onClick={cerrarModal}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(eliminarTarget)}
        title="Eliminar servicio"
        onClose={() => {
          setEliminarTarget(null)
          setErrorEliminar('')
        }}
      >
        {eliminarTarget && (
          <>
            {errorEliminar && (
              <Alert
                type="error"
                className="mb-4"
                onClose={() => setErrorEliminar('')}
              >
                {errorEliminar}
              </Alert>
            )}

            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <p>
                ¿Eliminar el servicio{' '}
                <strong>{eliminarTarget.nombre}</strong>?
              </p>
              <p className="mt-3 text-red-800/80">
                Se quitarán tarifas especiales y deudas pendientes sin cobro
                asociadas a este servicio.
              </p>
              <p className="mt-2 text-red-800/80">
                Si ya hubo cobros con este servicio, no se podrá eliminar para
                conservar el historial.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="danger"
                disabled={eliminando}
                className="flex-1"
                onClick={handleEliminar}
              >
                {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEliminarTarget(null)}
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
