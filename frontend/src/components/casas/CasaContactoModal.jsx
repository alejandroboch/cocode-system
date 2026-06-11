import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Alert from '../ui/Alert'
import FormField, { inputClassName } from '../ui/FormField'
import { obtenerCasa, actualizarContactoCasa } from '../../services/casaService'

export default function CasaContactoModal({ open, casa, token, onClose, onGuardado }) {
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [telefonos, setTelefonos] = useState([])
  const [placasAuto, setPlacasAuto] = useState([])
  const [placasMoto, setPlacasMoto] = useState([])
  const [nuevoTelefono, setNuevoTelefono] = useState('')
  const [nuevaPlacaAuto, setNuevaPlacaAuto] = useState('')
  const [nuevaPlacaMoto, setNuevaPlacaMoto] = useState('')

  useEffect(() => {
    if (!open || !casa?.id || !token) {
      return
    }

    let cancelado = false
    setCargando(true)
    setError('')
    setMensaje('')

    obtenerCasa(token, casa.id)
      .then((data) => {
        if (cancelado) return
        setTelefonos((data.telefonos ?? []).map((item) => item.numero))
        setPlacasAuto(
          (data.placas ?? [])
            .filter((item) => item.tipo === 'AUTO')
            .map((item) => item.placa),
        )
        setPlacasMoto(
          (data.placas ?? [])
            .filter((item) => item.tipo === 'MOTO')
            .map((item) => item.placa),
        )
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err.message ?? 'No se pudo cargar el contacto de la casa')
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [open, casa?.id, token])

  function agregarTelefono() {
    const numero = nuevoTelefono.trim()
    if (!numero) return
    if (telefonos.includes(numero)) {
      setError('Ese teléfono ya está en la lista')
      return
    }
    setTelefonos([...telefonos, numero])
    setNuevoTelefono('')
    setError('')
  }

  function agregarPlaca(tipo) {
    const valor = (tipo === 'AUTO' ? nuevaPlacaAuto : nuevaPlacaMoto)
      .trim()
      .toUpperCase()
    if (!valor) return

    const lista = tipo === 'AUTO' ? placasAuto : placasMoto
    const otraLista = tipo === 'AUTO' ? placasMoto : placasAuto

    if (lista.includes(valor) || otraLista.includes(valor)) {
      setError('Esa placa ya está registrada para esta casa')
      return
    }

    if (tipo === 'AUTO') {
      setPlacasAuto([...placasAuto, valor])
      setNuevaPlacaAuto('')
    } else {
      setPlacasMoto([...placasMoto, valor])
      setNuevaPlacaMoto('')
    }
    setError('')
  }

  async function handleGuardar(event) {
    event.preventDefault()
    if (!casa?.id) return

    setGuardando(true)
    setError('')
    setMensaje('')

    try {
      const placas = [
        ...placasAuto.map((placa) => ({ placa, tipo: 'AUTO' })),
        ...placasMoto.map((placa) => ({ placa, tipo: 'MOTO' })),
      ]

      await actualizarContactoCasa(token, casa.id, { telefonos, placas })
      setMensaje('Teléfonos y placas guardados correctamente')
      onGuardado?.()
    } catch (err) {
      setError(err.message ?? 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      open={open}
      title={
        casa
          ? `Teléfonos y placas — Casa #${casa.codigoCasa}`
          : 'Teléfonos y placas'
      }
      onClose={onClose}
      size="lg"
    >
      {casa && (
        <p className="mb-4 text-sm text-cocode-text/70">
          {casa.direccion}
          {casa.propietarioActual ? ` · ${casa.propietarioActual}` : ''}
        </p>
      )}

      {error && (
        <Alert type="error" className="mb-4" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {mensaje && (
        <Alert type="success" className="mb-4" onClose={() => setMensaje('')}>
          {mensaje}
        </Alert>
      )}

      {cargando ? (
        <p className="text-sm text-cocode-text/70">Cargando datos…</p>
      ) : (
        <form onSubmit={handleGuardar} className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-cocode-heading">
              Teléfonos
            </h3>
            <p className="mt-1 text-xs text-cocode-text/60">
              Puede registrar varios números o dejar la lista vacía.
            </p>

            {telefonos.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {telefonos.map((numero) => (
                  <li
                    key={numero}
                    className="flex items-center justify-between rounded-xl border border-cocode-mint/40 bg-cocode-cream/40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-cocode-heading">
                      {numero}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setTelefonos(telefonos.filter((item) => item !== numero))
                      }
                      className="text-xs font-medium text-cocode-coral-deep hover:underline"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-cocode-text/60">
                Sin teléfonos registrados.
              </p>
            )}

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="tel"
                value={nuevoTelefono}
                onChange={(e) => setNuevoTelefono(e.target.value)}
                placeholder="Ej. 502 1234-5678"
                className={`${inputClassName} flex-1`}
              />
              <Button type="button" variant="secondary" onClick={agregarTelefono}>
                Agregar teléfono
              </Button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-cocode-heading">
              Placas de vehículos
            </h3>
            <p className="mt-1 text-xs text-cocode-text/60">
              Registre autos y motos por separado. También puede quedar sin placas.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <ListaPlacas
                titulo="Autos"
                placas={placasAuto}
                valor={nuevaPlacaAuto}
                onChange={setNuevaPlacaAuto}
                onAgregar={() => agregarPlaca('AUTO')}
                onQuitar={(placa) =>
                  setPlacasAuto(placasAuto.filter((item) => item !== placa))
                }
              />
              <ListaPlacas
                titulo="Motos"
                placas={placasMoto}
                valor={nuevaPlacaMoto}
                onChange={setNuevaPlacaMoto}
                onAgregar={() => agregarPlaca('MOTO')}
                onQuitar={(placa) =>
                  setPlacasMoto(placasMoto.filter((item) => item !== placa))
                }
              />
            </div>
          </section>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={guardando} className="flex-1">
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function ListaPlacas({ titulo, placas, valor, onChange, onAgregar, onQuitar }) {
  return (
    <div className="rounded-2xl border border-cocode-mint/40 bg-white p-4">
      <h4 className="text-sm font-medium text-cocode-heading">{titulo}</h4>

      {placas.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {placas.map((placa) => (
            <li
              key={placa}
              className="flex items-center justify-between rounded-lg border border-cocode-mint/30 px-3 py-2 text-sm"
            >
              <span className="font-semibold tracking-wide text-cocode-heading">
                {placa}
              </span>
              <button
                type="button"
                onClick={() => onQuitar(placa)}
                className="text-xs font-medium text-cocode-coral-deep hover:underline"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-cocode-text/60">Sin placas registradas.</p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <FormField label={`Nueva placa (${titulo.toLowerCase()})`} id={`placa-${titulo}`}>
          <input
            id={`placa-${titulo}`}
            type="text"
            value={valor}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder="Ej. P123ABC"
            className={inputClassName}
          />
        </FormField>
        <Button type="button" size="sm" variant="secondary" onClick={onAgregar}>
          Agregar {titulo.toLowerCase().slice(0, -1)}
        </Button>
      </div>
    </div>
  )
}
