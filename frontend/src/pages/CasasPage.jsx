import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  buscarCasas,
  crearCasa,
  editarCasa,
  listarCasas,
} from '../services/casaService'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName, selectClassName } from '../components/ui/FormField'
import { ActivoBadge, EstadoCasaBadge } from '../components/ui/StatusBadge'
import CasaContactoModal from '../components/casas/CasaContactoModal'

const ESTADOS_CASA = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'VACIA', label: 'Vacía' },
  { value: 'ABANDONADA', label: 'Abandonada' },
  { value: 'ALQUILADA', label: 'Alquilada' },
]

const casaVacia = {
  codigoCasa: '',
  manzana: '',
  lote: '',
  direccion: '',
  propietarioActual: '',
  observaciones: '',
  estado: 'ACTIVA',
  activo: true,
  sectorId: '',
}

export default function CasasPage() {
  const navigate = useNavigate()
  const { token, usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMINISTRADOR'

  const [casas, setCasas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(casaVacia)
  const [guardando, setGuardando] = useState(false)

  const [contactoCasa, setContactoCasa] = useState(null)

  const cargarCasas = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listarCasas(token)
      setCasas(data)
    } catch (err) {
      setError(err.message ?? 'No se pudieron cargar las casas')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    cargarCasas()
  }, [cargarCasas])

  async function handleBuscar(event) {
    event.preventDefault()
    if (!busqueda.trim()) {
      cargarCasas()
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await buscarCasas(token, busqueda.trim())
      setCasas(data)
    } catch (err) {
      setError(err.message ?? 'Error en la búsqueda')
    } finally {
      setLoading(false)
    }
  }

  function abrirCrear() {
    setEditando(null)
    setForm(casaVacia)
    setModalOpen(true)
  }

  function abrirEditar(casa) {
    setEditando(casa)
    setForm({
      codigoCasa: String(casa.codigoCasa),
      manzana: casa.manzana ?? '',
      lote: casa.lote ?? '',
      direccion: casa.direccion ?? '',
      propietarioActual: casa.propietarioActual ?? '',
      observaciones: casa.observaciones ?? '',
      estado: casa.estado ?? 'ACTIVA',
      activo: casa.activo ?? true,
      sectorId: casa.sectorId ? String(casa.sectorId) : '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setGuardando(true)
    setMensaje('')

    const payload = {
      codigoCasa: Number(form.codigoCasa),
      manzana: form.manzana.trim(),
      lote: form.lote.trim(),
      direccion: form.direccion.trim(),
      propietarioActual: form.propietarioActual.trim() || null,
      observaciones: form.observaciones.trim() || null,
      estado: form.estado,
      sectorId: form.sectorId ? Number(form.sectorId) : null,
    }

    try {
      if (editando) {
        await editarCasa(token, editando.id, {
          ...payload,
          activo: form.activo,
        })
        setMensaje('Casa actualizada correctamente')
      } else {
        await crearCasa(token, payload)
        setMensaje('Casa registrada correctamente')
      }
      setModalOpen(false)
      cargarCasas()
    } catch (err) {
      setMensaje(err.message ?? 'No se pudo guardar la casa')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Casas"
        description="Registro, teléfonos y placas de viviendas de la colonia"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/casas/telefonos')}
            >
              Listado de teléfonos
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/casas/placas')}
            >
              Listado de placas
            </Button>
            {esAdmin && (
              <Button onClick={abrirCrear}>+ Nueva casa</Button>
            )}
          </div>
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

      <form
        onSubmit={handleBuscar}
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por código, dirección, propietario, teléfono o placa…"
          className={`${inputClassName} flex-1`}
        />
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
          {busqueda && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setBusqueda('')
                cargarCasas()
              }}
            >
              Limpiar
            </Button>
          )}
        </div>
      </form>

      <div className="surface-table">
        {loading ? (
          <p className="p-8 text-center text-sm text-cocode-text/70">Cargando casas…</p>
        ) : casas.length === 0 ? (
          <p className="p-8 text-center text-sm text-cocode-text/70">
            No hay casas registradas
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Mz</th>
                  <th className="px-4 py-3 font-semibold">Lt</th>
                  <th className="px-4 py-3 font-semibold">Dirección</th>
                  <th className="px-4 py-3 font-semibold">Propietario</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Cobro</th>
                  <th className="px-4 py-3 font-semibold">Teléfonos</th>
                  <th className="px-4 py-3 font-semibold">Placas</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {casas.map((casa) => (
                  <tr
                    key={casa.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold text-cocode-heading">
                      {casa.codigoCasa}
                    </td>
                    <td className="px-4 py-3 text-cocode-text">
                      {casa.manzana || '—'}
                    </td>
                    <td className="px-4 py-3 text-cocode-text">
                      {casa.lote || '—'}
                    </td>
                    <td className="px-4 py-3 text-cocode-text">{casa.direccion}</td>
                    <td className="px-4 py-3 text-cocode-text">
                      {casa.propietarioActual || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoCasaBadge estado={casa.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <ActivoBadge activo={casa.activo} />
                    </td>
                    <td className="px-4 py-3 text-cocode-text">
                      {casa._count?.telefonos ?? 0}
                    </td>
                    <td className="px-4 py-3 text-cocode-text">
                      {casa._count?.placas ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setContactoCasa(casa)}
                        >
                          Teléfonos y placas
                        </Button>
                        {esAdmin && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => abrirEditar(casa)}
                          >
                            Editar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editando ? 'Editar casa' : 'Nueva casa'}
        onClose={() => setModalOpen(false)}
      >
        {mensaje && modalOpen && (
          <Alert type="error" className="mb-4" onClose={() => setMensaje('')}>
            {mensaje}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Código de casa" id="codigoCasa">
              <input
                id="codigoCasa"
                type="number"
                required
                min="1"
                value={form.codigoCasa}
                onChange={(e) => setForm({ ...form, codigoCasa: e.target.value })}
                className={inputClassName}
              />
            </FormField>

            <FormField label="Estado" id="estado">
              <select
                id="estado"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className={selectClassName}
              >
                {ESTADOS_CASA.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Manzana" id="manzana">
              <input
                id="manzana"
                type="text"
                required
                value={form.manzana}
                onChange={(e) => setForm({ ...form, manzana: e.target.value })}
                className={inputClassName}
                placeholder="Ej. 5"
              />
            </FormField>

            <FormField label="Lote" id="lote">
              <input
                id="lote"
                type="text"
                required
                value={form.lote}
                onChange={(e) => setForm({ ...form, lote: e.target.value })}
                className={inputClassName}
                placeholder="Ej. 12"
              />
            </FormField>
          </div>

          <FormField label="Dirección" id="direccion">
            <input
              id="direccion"
              type="text"
              required
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className={inputClassName}
            />
          </FormField>

          <FormField label="Propietario actual" id="propietario">
            <input
              id="propietario"
              type="text"
              value={form.propietarioActual}
              onChange={(e) =>
                setForm({ ...form, propietarioActual: e.target.value })
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="Observaciones" id="observaciones">
            <textarea
              id="observaciones"
              rows={3}
              value={form.observaciones}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
              className={inputClassName}
            />
          </FormField>

          {editando && (
            <FormField label="Participa en cobros" id="activo">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-cocode-mint/40 bg-cocode-cream/50 px-4 py-3">
                <input
                  id="activo"
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) =>
                    setForm({ ...form, activo: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-cocode-mint-deep"
                />
                <span className="text-sm text-cocode-heading">
                  Casa activa para generación de deudas
                </span>
              </label>
            </FormField>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={guardando} className="flex-1">
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar casa'}
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

      <CasaContactoModal
        open={Boolean(contactoCasa)}
        casa={contactoCasa}
        token={token}
        onClose={() => setContactoCasa(null)}
        onGuardado={cargarCasas}
      />
    </>
  )
}
