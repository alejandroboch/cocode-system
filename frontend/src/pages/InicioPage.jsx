import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { obtenerDashboard } from '../services/reporteService'
import {
  formatEntero,
  formatQuetzales,
  MESES,
} from '../lib/deudaUtils'
import { formatFechaCorta, hoyIso, inicioMesActualIso } from '../lib/reporteUtils'
import { GraficaCoberturaCobro } from '../components/dashboard/DashboardCharts'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName, selectClassName } from '../components/ui/FormField'

const FILTROS = [
  { id: 'mes_actual', label: 'Mes actual' },
  { id: 'mes', label: 'Elegir mes' },
  { id: 'custom', label: 'Fechas específicas' },
]

export default function InicioPage() {
  const { token } = useAuth()
  const hoy = new Date()

  const [filtro, setFiltro] = useState('mes_actual')
  const [mesSel, setMesSel] = useState(hoy.getMonth() + 1)
  const [anioSel, setAnioSel] = useState(hoy.getFullYear())
  const [fechaDesde, setFechaDesde] = useState(inicioMesActualIso())
  const [fechaHasta, setFechaHasta] = useState(hoyIso())

  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const paramsConsulta = useMemo(() => {
    if (filtro === 'custom') {
      return { inicio: fechaDesde, fin: fechaHasta }
    }
    if (filtro === 'mes') {
      return { mes: mesSel, anio: anioSel }
    }
    return {}
  }, [filtro, mesSel, anioSel, fechaDesde, fechaHasta])

  const cargarDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await obtenerDashboard(token, paramsConsulta)
      setDashboard(data)
    } catch (err) {
      setDashboard(null)
      setError(err.message ?? 'No se pudo cargar el resumen')
    } finally {
      setLoading(false)
    }
  }, [token, paramsConsulta])

  useEffect(() => {
    cargarDashboard()
  }, [cargarDashboard])

  function seleccionarFiltro(id) {
    setFiltro(id)
    if (id === 'mes_actual') {
      setMesSel(hoy.getMonth() + 1)
      setAnioSel(hoy.getFullYear())
      setFechaDesde(inicioMesActualIso())
      setFechaHasta(hoyIso())
    }
  }

  function handleAplicar(event) {
    event.preventDefault()
    cargarDashboard()
  }

  const etiquetaPeriodo = dashboard?.periodo?.etiqueta ?? 'Mes actual'

  return (
    <>
      <PageHeader
        title="Panel de inicio"
        description={
          dashboard
            ? `Resumen · recaudación del periodo: ${etiquetaPeriodo}`
            : 'Resumen general del sistema'
        }
      />

      {error && (
        <Alert type="warning" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form
        onSubmit={handleAplicar}
        className="mb-6 rounded-2xl border border-cocode-mint/40 bg-white p-5 shadow-sm"
      >
        <p className="mb-4 text-sm font-medium text-cocode-heading">
          Periodo del dashboard
        </p>
        <p className="mb-4 -mt-2 text-xs text-cocode-text/60">
          La recaudación usa fecha de cobro. La cobertura por servicio usa el
          mes de la deuda (enero, febrero, etc.).
        </p>

        <div className="flex flex-wrap gap-2">
          {FILTROS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => seleccionarFiltro(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filtro === item.id
                  ? 'bg-cocode-mint-deep text-white shadow-sm'
                  : 'border border-cocode-mint/50 bg-white text-cocode-text/80 hover:bg-cocode-mint/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {filtro === 'mes' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Mes" id="dashMes">
              <select
                id="dashMes"
                value={mesSel}
                onChange={(e) => setMesSel(Number(e.target.value))}
                className={selectClassName}
              >
                {MESES.map((mes) => (
                  <option key={mes.value} value={mes.value}>
                    {mes.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Año" id="dashAnio">
              <input
                id="dashAnio"
                type="number"
                min="2020"
                max="2100"
                value={anioSel}
                onChange={(e) => setAnioSel(Number(e.target.value))}
                className={inputClassName}
              />
            </FormField>
          </div>
        )}

        {filtro === 'custom' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Desde" id="dashDesde">
              <input
                id="dashDesde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className={inputClassName}
                required
              />
            </FormField>
            <FormField label="Hasta" id="dashHasta">
              <input
                id="dashHasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className={inputClassName}
                required
              />
            </FormField>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {dashboard?.periodo && (
            <p className="text-sm text-cocode-text/70">
              {formatFechaCorta(dashboard.periodo.inicio)} —{' '}
              {formatFechaCorta(dashboard.periodo.fin)}
            </p>
          )}
          <Button type="submit" disabled={loading} size="sm">
            {loading ? 'Actualizando…' : 'Actualizar'}
          </Button>
        </div>
      </form>

      {loading && !dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="surface-card h-28 animate-pulse bg-slate-50"
            />
          ))}
        </div>
      )}

      {dashboard && (
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Tarjeta
              titulo="Casas activas"
              valor={formatEntero(dashboard.casasActivas)}
              accent="teal"
              delay="stagger-1"
            />
            <Tarjeta
              titulo="Deudas pendientes"
              valor={formatEntero(dashboard.deudasPendientes)}
              subtitulo="Estado actual del sistema"
              accent="rose"
              delay="stagger-2"
            />
            <Tarjeta
              titulo="Total pendiente"
              valor={formatQuetzales(dashboard.totalPendiente)}
              subtitulo="Monto + mora adeudado (todo el sistema)"
              accent="slate"
              delay="stagger-3"
            />
            <Tarjeta
              titulo={`Pagos en ${etiquetaPeriodo}`}
              subtitulo="Recibos activos en el periodo"
              valor={formatEntero(dashboard.pagosPeriodo)}
              accent="teal"
              delay="stagger-4"
            />
            <Tarjeta
              titulo={`Recaudado en ${etiquetaPeriodo}`}
              subtitulo="Según fecha de cobro"
              valor={formatQuetzales(dashboard.recaudadoPeriodo)}
              accent="sky"
              delay="stagger-5"
            />
            <Tarjeta
              titulo={`Pendiente en ${etiquetaPeriodo}`}
              valor={formatQuetzales(dashboard.totalPendientePeriodo)}
              subtitulo={`${formatEntero(dashboard.deudasPendientesPeriodo)} deudas · mes de deuda del periodo`}
              accent="amber"
              delay="stagger-6"
            />
          </section>

          <section>
            <PanelGrafica
              titulo="Cobertura de cobro por servicio"
              descripcion={
                dashboard.coberturaPorMes?.length === 1
                  ? `% de las ${formatEntero(dashboard.casasActivas)} casas activas que pagaron o aún deben — periodo de deuda: ${dashboard.coberturaPorMes[0].etiqueta}`
                  : `% de casas que aún deben por mes de deuda (base: ${formatEntero(dashboard.casasActivas)} casas activas)`
              }
            >
              <GraficaCoberturaCobro
                coberturaPorMes={dashboard.coberturaPorMes}
                totalCasas={dashboard.casasActivas}
              />
            </PanelGrafica>
          </section>
        </>
      )}
    </>
  )
}

function PanelGrafica({ titulo, descripcion, children, className = '' }) {
  return (
    <article
      className={`rounded-2xl border border-cocode-mint/40 bg-white p-5 shadow-sm ${className}`}
    >
      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-cocode-heading">
        {titulo}
      </h2>
      <p className="mt-1 text-sm text-cocode-text/60">{descripcion}</p>
      <div className="mt-4">{children}</div>
    </article>
  )
}

const accentStyles = {
  teal: 'border-l-cocode-mint-deep',
  rose: 'border-l-cocode-coral-deep',
  slate: 'border-l-cocode-heading',
  amber: 'border-l-cocode-gold-bright',
  sky: 'border-l-sky-600',
}

function Tarjeta({ titulo, subtitulo, valor, accent = 'teal', delay = '' }) {
  return (
    <article
      className={`surface-card animate-fade-up border-l-4 p-5 ${accentStyles[accent]} ${delay}`}
    >
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {titulo}
      </p>
      {subtitulo && (
        <p className="mt-1 text-xs text-slate-400">{subtitulo}</p>
      )}
      <p className="mt-3 text-2xl font-bold tracking-tight text-cocode-heading">
        {valor}
      </p>
    </article>
  )
}
