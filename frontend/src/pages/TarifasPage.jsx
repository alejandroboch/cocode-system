import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listarCasas } from '../services/casaService'
import { listarServicios } from '../services/servicioService'
import {
  crearTarifa,
  desactivarTarifa,
  listarTarifas,
} from '../services/tarifaEspecialService'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName, selectClassName } from '../components/ui/FormField'

const tarifaVacia = {
  casaId: '',
  servicioId: '',
  monto: '',
}

export default function TarifasPage() {
  const { token, usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMINISTRADOR'

  const [tarifas, setTarifas] = useState([])
  const [casas, setCasas] = useState([])
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(tarifaVacia)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState('activas')

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [tarifasData, casasData, serviciosData] = await Promise.all([
        listarTarifas(token),
        listarCasas(token),
        listarServicios(token),
      ])
      setTarifas(tarifasData)
      setCasas(casasData.filter((c) => c.activo))
      setServicios(serviciosData)
    } catch (err) {
      setError(err.message ?? 'No se pudieron cargar las tarifas')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const tarifasFiltradas = tarifas.filter((tarifa) => {
    if (filtro === 'activas') return tarifa.activo
    if (filtro === 'inactivas') return !tarifa.activo
    return true
  })

  async function handleSubmit(event) {
    event.preventDefault()
    setGuardando(true)
    setMensaje('')

    try {
      await crearTarifa(token, {
        casaId: Number(form.casaId),
        servicioId: Number(form.servicioId),
        monto: Number(form.monto),
      })
      setMensaje('Tarifa especial guardada correctamente')
      setModalOpen(false)
      setForm(tarifaVacia)
      cargarDatos()
    } catch (err) {
      setMensaje(err.message ?? 'No se pudo guardar la tarifa')
    } finally {
      setGuardando(false)
    }
  }

  async function handleDesactivar(id) {
    if (!window.confirm('¿Desactivar esta tarifa especial?')) return

    try {
      await desactivarTarifa(token, id)
      setMensaje('Tarifa desactivada')
      cargarDatos()
    } catch (err) {
      setError(err.message ?? 'No se pudo desactivar la tarifa')
    }
  }

  return (
    <>
      <PageHeader
        title="Tarifas especiales"
        description="Montos personalizados por casa y servicio"
        action={
          esAdmin && (
            <Button onClick={() => setModalOpen(true)}>+ Nueva tarifa</Button>
          )
        }
      />

      {mensaje && !modalOpen && (
        <Alert type="success" className="mb-6" onClose={() => setMensaje('')}>
          {mensaje}
        </Alert>
      )}
      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { value: 'activas', label: 'Activas' },
          { value: 'inactivas', label: 'Inactivas' },
          { value: 'todas', label: 'Todas' },
        ].map((opcion) => (
          <button
            key={opcion.value}
            type="button"
            onClick={() => setFiltro(opcion.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filtro === opcion.value
                ? 'bg-cocode-mint/40 text-cocode-heading shadow-sm'
                : 'bg-white text-cocode-text/70 hover:bg-cocode-mint/15'
            }`}
          >
            {opcion.label}
          </button>
        ))}
      </div>

      <div className="surface-table">
        {loading ? (
          <p className="p-8 text-center text-sm text-cocode-text/70">
            Cargando tarifas…
          </p>
        ) : tarifasFiltradas.length === 0 ? (
          <p className="p-8 text-center text-sm text-cocode-text/70">
            No hay tarifas en este filtro
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  <th className="px-4 py-3 font-semibold">Casa</th>
                  <th className="px-4 py-3 font-semibold">Servicio</th>
                  <th className="px-4 py-3 font-semibold">Monto</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  {esAdmin && <th className="px-4 py-3 font-semibold">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {tarifasFiltradas.map((tarifa) => (
                  <tr
                    key={tarifa.id}
                    className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                      !tarifa.activo ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-cocode-heading">
                        #{tarifa.casa?.codigoCasa}
                      </p>
                      <p className="text-xs text-cocode-text/70">
                        {tarifa.casa?.propietarioActual || tarifa.casa?.direccion}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-cocode-text">
                      {tarifa.servicio?.nombre}
                    </td>
                    <td className="px-4 py-3 font-semibold text-cocode-heading">
                      Q{Number(tarifa.monto).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          tarifa.activo
                            ? 'bg-cocode-mint/40 text-cocode-heading'
                            : 'bg-cocode-coral/30 text-cocode-text/70'
                        }`}
                      >
                        {tarifa.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    {esAdmin && (
                      <td className="px-4 py-3">
                        {tarifa.activo && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDesactivar(tarifa.id)}
                          >
                            Desactivar
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title="Nueva tarifa especial"
        onClose={() => {
          setModalOpen(false)
          setMensaje('')
        }}
      >
        {mensaje && modalOpen && (
          <Alert type="error" className="mb-4" onClose={() => setMensaje('')}>
            {mensaje}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Casa" id="casaId">
            <select
              id="casaId"
              required
              value={form.casaId}
              onChange={(e) => setForm({ ...form, casaId: e.target.value })}
              className={selectClassName}
            >
              <option value="">Seleccionar casa…</option>
              {casas.map((casa) => (
                <option key={casa.id} value={casa.id}>
                  #{casa.codigoCasa} — {casa.direccion}
                  {casa.propietarioActual ? ` (${casa.propietarioActual})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Servicio" id="servicioId">
            <select
              id="servicioId"
              required
              value={form.servicioId}
              onChange={(e) => setForm({ ...form, servicioId: e.target.value })}
              className={selectClassName}
            >
              <option value="">Seleccionar servicio…</option>
              {servicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre} (base Q{Number(servicio.montoBase).toFixed(2)})
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Monto especial (Q)"
            id="monto"
            hint="Reemplaza la tarifa base para esta casa y servicio"
          >
            <input
              id="monto"
              type="number"
              required
              min="0"
              step="0.01"
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
              className={inputClassName}
              placeholder="0.00"
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={guardando} className="flex-1">
              {guardando ? 'Guardando…' : 'Guardar tarifa'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
