import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listarTelefonosCasas } from '../services/casaService'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { inputClassName } from '../components/ui/FormField'
import { ActivoBadge } from '../components/ui/StatusBadge'

export default function TelefonosCasasPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [registros, setRegistros] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async (termino = '') => {
    setLoading(true)
    setError('')
    try {
      const data = await listarTelefonosCasas(token, termino)
      setRegistros(data)
    } catch (err) {
      setError(err.message ?? 'No se pudieron cargar los teléfonos')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    cargar()
  }, [cargar])

  function handleBuscar(event) {
    event.preventDefault()
    cargar(busqueda.trim())
  }

  return (
    <>
      <PageHeader
        title="Teléfonos por casa"
        description="Consulta de números registrados en cada vivienda"
        action={
          <Button variant="secondary" onClick={() => navigate('/casas')}>
            Volver a casas
          </Button>
        }
      />

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
          placeholder="Buscar por código, dirección, propietario o teléfono…"
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
                cargar()
              }}
            >
              Limpiar
            </Button>
          )}
        </div>
      </form>

      <div className="surface-table">
        {loading ? (
          <p className="p-8 text-center text-sm text-cocode-text/70">
            Cargando teléfonos…
          </p>
        ) : registros.length === 0 ? (
          <p className="p-8 text-center text-sm text-cocode-text/70">
            No hay teléfonos registrados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Dirección</th>
                  <th className="px-4 py-3 font-semibold">Propietario</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold">Cobro</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold text-cocode-heading">
                      {item.codigoCasa}
                    </td>
                    <td className="px-4 py-3 text-cocode-text">{item.direccion}</td>
                    <td className="px-4 py-3 text-cocode-text">
                      {item.propietarioActual || '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-cocode-heading">
                      {item.numero}
                    </td>
                    <td className="px-4 py-3">
                      <ActivoBadge activo={item.activo} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && registros.length > 0 && (
        <p className="mt-4 text-sm text-cocode-text/60">
          {registros.length} teléfono{registros.length === 1 ? '' : 's'} registrado
          {registros.length === 1 ? '' : 's'}
        </p>
      )}
    </>
  )
}
