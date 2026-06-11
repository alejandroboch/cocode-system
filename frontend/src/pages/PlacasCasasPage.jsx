import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listarPlacasCasas } from '../services/casaService'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { inputClassName, selectClassName } from '../components/ui/FormField'
import { ActivoBadge } from '../components/ui/StatusBadge'

const FILTROS_TIPO = [
  { value: '', label: 'Todos' },
  { value: 'AUTO', label: 'Autos' },
  { value: 'MOTO', label: 'Motos' },
]

export default function PlacasCasasPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [registros, setRegistros] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(
    async (termino = '', filtroTipo = '') => {
      setLoading(true)
      setError('')
      try {
        const data = await listarPlacasCasas(token, {
          q: termino,
          tipo: filtroTipo,
        })
        setRegistros(data)
      } catch (err) {
        setError(err.message ?? 'No se pudieron cargar las placas')
      } finally {
        setLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    cargar()
  }, [cargar])

  function handleBuscar(event) {
    event.preventDefault()
    cargar(busqueda.trim(), tipo)
  }

  return (
    <>
      <PageHeader
        title="Placas por casa"
        description="Consulta de placas de autos y motos registradas"
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
        className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
      >
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por código, dirección, propietario o placa…"
          className={inputClassName}
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className={selectClassName}
        >
          {FILTROS_TIPO.map((item) => (
            <option key={item.value || 'todos'} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
          {(busqueda || tipo) && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setBusqueda('')
                setTipo('')
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
            Cargando placas…
          </p>
        ) : registros.length === 0 ? (
          <p className="p-8 text-center text-sm text-cocode-text/70">
            No hay placas registradas
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Dirección</th>
                  <th className="px-4 py-3 font-semibold">Propietario</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Placa</th>
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
                    <td className="px-4 py-3">
                      <TipoPlacaBadge tipo={item.tipo} />
                    </td>
                    <td className="px-4 py-3 font-semibold tracking-wide text-cocode-heading">
                      {item.placa}
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
          {registros.length} placa{registros.length === 1 ? '' : 's'} registrada
          {registros.length === 1 ? '' : 's'}
        </p>
      )}
    </>
  )
}

function TipoPlacaBadge({ tipo }) {
  const esAuto = tipo === 'AUTO'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        esAuto
          ? 'bg-cocode-sky/45 text-cocode-heading'
          : 'bg-cocode-gold/45 text-cocode-heading'
      }`}
    >
      {esAuto ? 'Auto' : 'Moto'}
    </span>
  )
}
