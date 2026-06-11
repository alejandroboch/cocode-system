import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  listarDeudasPendientesReporte,
  pagosPorFecha,
  recibosAnuladosPorFecha,
} from '../services/reporteService'
import {
  PERIODOS_REPORTE,
  calcularRangoPeriodo,
  formatFechaCorta,
  formatFechaReporte,
  hoyIso,
  inicioMesActualIso,
} from '../lib/reporteUtils'
import { formatQuetzales } from '../lib/deudaUtils'
import {
  exportarDeudasPendientesExcel,
  exportarRecaudacionExcel,
} from '../lib/exportExcel'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName } from '../components/ui/FormField'

const TABS = [
  { id: 'recaudacion', label: 'Recaudación' },
  { id: 'pendientes', label: 'Deudas pendientes' },
]

export default function ReportesPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState('recaudacion')

  const [periodo, setPeriodo] = useState('mes')
  const [fechaDesde, setFechaDesde] = useState(inicioMesActualIso())
  const [fechaHasta, setFechaHasta] = useState(hoyIso())

  const [recaudacion, setRecaudacion] = useState(null)
  const [anulados, setAnulados] = useState(null)
  const [pendientes, setPendientes] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const rango = useMemo(
    () => calcularRangoPeriodo(periodo, fechaDesde, fechaHasta),
    [periodo, fechaDesde, fechaHasta],
  )

  const netoRecaudado = useMemo(() => {
    if (!recaudacion) return 0
    return recaudacion.totalRecaudado - (anulados?.totalAnulado ?? 0)
  }, [recaudacion, anulados])

  const cargarRecaudacion = useCallback(async () => {
    if (!rango.inicio || !rango.fin) {
      setError('Indica fecha inicial y final')
      return
    }

    if (rango.inicio > rango.fin) {
      setError('La fecha inicial no puede ser posterior a la final')
      return
    }

    setLoading(true)
    setError('')

    try {
      const [pagosData, anuladosData] = await Promise.all([
        pagosPorFecha(token, {
          inicio: rango.inicio,
          fin: rango.fin,
        }),
        recibosAnuladosPorFecha(token, {
          inicio: rango.inicio,
          fin: rango.fin,
        }),
      ])
      setRecaudacion(pagosData)
      setAnulados(anuladosData)
    } catch (err) {
      setRecaudacion(null)
      setAnulados(null)
      setError(err.message ?? 'No se pudo cargar el reporte')
    } finally {
      setLoading(false)
    }
  }, [token, rango.inicio, rango.fin])

  const cargarPendientes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listarDeudasPendientesReporte(token)
      setPendientes(data)
    } catch (err) {
      setPendientes([])
      setError(err.message ?? 'No se pudieron cargar las deudas pendientes')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (tab === 'recaudacion') cargarRecaudacion()
    if (tab === 'pendientes') cargarPendientes()
  }, [tab, cargarRecaudacion, cargarPendientes])

  function seleccionarPeriodo(id) {
    setPeriodo(id)
    if (id === 'custom') return

    const nuevo = calcularRangoPeriodo(id)
    setFechaDesde(nuevo.inicio)
    setFechaHasta(nuevo.fin)
  }

  function handleBuscar(event) {
    event.preventDefault()
    if (tab === 'recaudacion') cargarRecaudacion()
  }

  function descargarExcelRecaudacion() {
    if (!recaudacion) return
    exportarRecaudacionExcel({
      rango,
      recaudacion,
      anulados,
      netoRecaudado,
    })
  }

  function descargarExcelPendientes() {
    if (pendientes.length === 0) return
    exportarDeudasPendientesExcel(pendientes, totalPendientes)
  }

  const totalPendientes = useMemo(
    () => pendientes.reduce((t, c) => t + c.totalPendiente, 0),
    [pendientes],
  )

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Recaudación por fecha de cobro y deudas pendientes"
      />

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? 'bg-cocode-mint/40 text-cocode-heading shadow-sm'
                : 'bg-white text-cocode-text/70 hover:bg-cocode-mint/15'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'recaudacion' && (
        <>
          <form
            onSubmit={handleBuscar}
            className="mb-6 rounded-2xl border border-cocode-mint/40 bg-white p-5 shadow-sm"
          >
            <p className="mb-4 text-sm font-medium text-cocode-heading">
              Periodo del reporte
            </p>

            <div className="flex flex-wrap gap-2">
              {PERIODOS_REPORTE.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => seleccionarPeriodo(item.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    periodo === item.id
                      ? 'bg-cocode-mint-deep text-white shadow-sm'
                      : 'border border-cocode-mint/50 bg-white text-cocode-text/80 hover:bg-cocode-mint/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {periodo === 'custom' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="Desde" id="fechaDesde">
                  <input
                    id="fechaDesde"
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className={inputClassName}
                    required
                  />
                </FormField>
                <FormField label="Hasta" id="fechaHasta">
                  <input
                    id="fechaHasta"
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
              <p className="text-sm text-cocode-text/70">
                {formatFechaCorta(rango.inicio)} — {formatFechaCorta(rango.fin)}
                <span className="ml-2 text-cocode-text/50">({rango.etiqueta})</span>
              </p>
              <Button type="submit" disabled={loading}>
                {loading ? 'Consultando…' : 'Actualizar'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={loading || !recaudacion}
                onClick={descargarExcelRecaudacion}
              >
                Descargar Excel
              </Button>
            </div>
          </form>

          {loading && !recaudacion ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-2xl border border-cocode-mint/30 bg-white"
                />
              ))}
            </div>
          ) : recaudacion ? (
            <>
              <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ResumenCard
                  titulo="Total recaudado"
                  valor={formatQuetzales(recaudacion.totalRecaudado)}
                  detalle="Recibos activos cobrados en el periodo"
                  accent="mint"
                />
                <ResumenCard
                  titulo="Pagos registrados"
                  valor={recaudacion.cantidadPagos}
                  detalle="Cantidad de cobros"
                  accent="sky"
                />
                <ResumenCard
                  titulo="Recibos anulados"
                  valor={anulados?.cantidad ?? 0}
                  detalle={
                    anulados?.totalAnulado
                      ? `${formatQuetzales(anulados.totalAnulado)} anulados`
                      : 'Sin anulaciones en el periodo'
                  }
                  accent="coral"
                />
                <ResumenCard
                  titulo="Recaudación neta"
                  valor={formatQuetzales(netoRecaudado)}
                  detalle="Recaudado menos anulaciones del periodo"
                  accent="gold"
                />
              </section>

              {recaudacion.porServicio?.length > 0 && (
                <section className="mb-6 rounded-2xl border border-cocode-mint/40 bg-white shadow-sm">
                  <div className="border-b border-cocode-mint/30 px-5 py-4">
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-cocode-heading">
                      Recaudación por servicio
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-cocode-mint/20 bg-cocode-cream/50 text-xs uppercase tracking-wide text-cocode-text/60">
                          <th className="px-4 py-3 font-semibold">Servicio</th>
                          <th className="px-4 py-3 font-semibold">Pagos</th>
                          <th className="px-4 py-3 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cocode-mint/20">
                        {recaudacion.porServicio.map((item) => (
                          <tr key={item.servicio} className="hover:bg-cocode-mint/5">
                            <td className="px-4 py-3 font-medium text-cocode-heading">
                              {item.servicio}
                            </td>
                            <td className="px-4 py-3">{item.cantidad}</td>
                            <td className="px-4 py-3 font-medium">
                              {formatQuetzales(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-cocode-mint/40 bg-white shadow-sm">
                <div className="border-b border-cocode-mint/30 px-5 py-4">
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-cocode-heading">
                    Detalle de cobros
                  </h2>
                  <p className="mt-1 text-sm text-cocode-text/60">
                    {recaudacion.cantidadPagos} pago(s) en el periodo
                  </p>
                </div>

                {recaudacion.pagos.length === 0 ? (
                  <div className="p-12 text-center text-sm text-cocode-text/60">
                    No hubo cobros en este periodo.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[880px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-cocode-mint/20 bg-cocode-cream/50 text-xs uppercase tracking-wide text-cocode-text/60">
                          <th className="px-4 py-3 font-semibold">Fecha</th>
                          <th className="px-4 py-3 font-semibold">Recibo</th>
                          <th className="px-4 py-3 font-semibold">Casa</th>
                          <th className="px-4 py-3 font-semibold">Servicio</th>
                          <th className="px-4 py-3 font-semibold">Periodo deuda</th>
                          <th className="px-4 py-3 font-semibold">Monto</th>
                          <th className="px-4 py-3 font-semibold">Cobró</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cocode-mint/20">
                        {recaudacion.pagos.map((pago) => (
                          <tr
                            key={`${pago.numeroRecibo}-${pago.fecha}`}
                            className="hover:bg-cocode-mint/5"
                          >
                            <td className="whitespace-nowrap px-4 py-3">
                              {formatFechaReporte(pago.fecha)}
                            </td>
                            <td className="px-4 py-3 font-medium text-cocode-heading">
                              {pago.numeroRecibo}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium">#{pago.codigoCasa}</span>
                              {pago.propietario && (
                                <span className="block text-xs text-cocode-text/60">
                                  {pago.propietario}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">{pago.servicio}</td>
                            <td className="px-4 py-3">{pago.periodo}</td>
                            <td className="px-4 py-3 font-medium">
                              {formatQuetzales(pago.monto)}
                            </td>
                            <td className="px-4 py-3">{pago.usuario}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {anulados?.recibos?.length > 0 && (
                <section className="mt-6 rounded-2xl border border-cocode-coral/30 bg-white shadow-sm">
                  <div className="border-b border-cocode-coral/20 px-5 py-4">
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-cocode-heading">
                      Recibos anulados en el periodo
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-cocode-mint/20 bg-cocode-cream/50 text-xs uppercase tracking-wide text-cocode-text/60">
                          <th className="px-4 py-3 font-semibold">Anulado</th>
                          <th className="px-4 py-3 font-semibold">Recibo</th>
                          <th className="px-4 py-3 font-semibold">Casa</th>
                          <th className="px-4 py-3 font-semibold">Monto</th>
                          <th className="px-4 py-3 font-semibold">Motivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cocode-mint/20">
                        {anulados.recibos.map((recibo) => (
                          <tr key={recibo.numeroRecibo} className="hover:bg-red-50/30">
                            <td className="whitespace-nowrap px-4 py-3">
                              {formatFechaReporte(recibo.fechaAnulacion)}
                            </td>
                            <td className="px-4 py-3 font-medium">{recibo.numeroRecibo}</td>
                            <td className="px-4 py-3">#{recibo.codigoCasa}</td>
                            <td className="px-4 py-3">{formatQuetzales(recibo.monto)}</td>
                            <td className="max-w-xs px-4 py-3 text-cocode-text/70">
                              {recibo.motivoAnulacion ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          ) : null}
        </>
      )}

      {tab === 'pendientes' && (
        <section className="rounded-2xl border border-cocode-mint/40 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cocode-mint/30 px-5 py-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-cocode-heading">
                Casas con deuda pendiente
              </h2>
              <p className="mt-1 text-sm text-cocode-text/60">
                {pendientes.length} casa(s) · Total {formatQuetzales(totalPendientes)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={loading}
                onClick={cargarPendientes}
              >
                Actualizar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={loading || pendientes.length === 0}
                onClick={descargarExcelPendientes}
              >
                Descargar Excel
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-cocode-text/60">
              Cargando…
            </div>
          ) : pendientes.length === 0 ? (
            <div className="p-12 text-center text-sm text-cocode-text/60">
              No hay casas con deudas pendientes.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-cocode-mint/20 bg-cocode-cream/50 text-xs uppercase tracking-wide text-cocode-text/60">
                    <th className="px-4 py-3 font-semibold">Casa</th>
                    <th className="px-4 py-3 font-semibold">Propietario</th>
                    <th className="px-4 py-3 font-semibold">Deudas</th>
                    <th className="px-4 py-3 font-semibold">Total pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cocode-mint/20">
                  {pendientes.map((casa) => (
                    <tr key={casa.codigoCasa} className="hover:bg-cocode-mint/5">
                      <td className="px-4 py-3 font-medium text-cocode-heading">
                        #{casa.codigoCasa}
                      </td>
                      <td className="px-4 py-3">
                        <span>{casa.propietario ?? '—'}</span>
                        {casa.direccion && (
                          <span className="block text-xs text-cocode-text/60">
                            {casa.direccion}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{casa.cantidadDeudas}</td>
                      <td className="px-4 py-3 font-medium text-cocode-coral-deep">
                        {formatQuetzales(casa.totalPendiente)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  )
}

function ResumenCard({ titulo, valor, detalle, accent }) {
  const borders = {
    mint: 'border-l-cocode-mint-deep',
    sky: 'border-l-sky-600',
    coral: 'border-l-cocode-coral-deep',
    gold: 'border-l-cocode-gold-bright',
  }

  return (
    <article
      className={`rounded-2xl border border-cocode-mint/30 bg-white p-5 shadow-sm border-l-4 ${borders[accent] ?? borders.mint}`}
    >
      <p className="text-xs font-semibold tracking-wide text-cocode-text/50 uppercase">
        {titulo}
      </p>
      <p className="mt-2 text-2xl font-bold text-cocode-heading">{valor}</p>
      {detalle && (
        <p className="mt-1 text-xs text-cocode-text/60">{detalle}</p>
      )}
    </article>
  )
}
