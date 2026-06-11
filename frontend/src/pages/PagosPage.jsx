import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listarCasas, buscarCasaPorUbicacion } from '../services/casaService'
import { obtenerDeudasCasa } from '../services/deudaService'
import { estadoCuenta } from '../services/reporteService'
import { registrarPago } from '../services/pagoService'
import { obtenerRecibo } from '../services/reciboService'
import { obtenerConfiguracion } from '../services/configuracionService'
import {
  formatPeriodo,
  formatQuetzales,
  nombreMes,
  totalDeuda,
} from '../lib/deudaUtils'
import {
  esServicioAgua,
  puedeAplicarMora,
  textoReglaMora,
} from '../lib/reglasCobro'
import {
  etiquetaCasa,
  formatearUbicacion,
  normalizarUbicacion,
} from '../lib/ubicacionCasa'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ReciboImpresionModal from '../components/recibo/ReciboImpresionModal'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName, selectClassName } from '../components/ui/FormField'

const TABS = [
  { id: 'cuenta', label: 'Estado de cuenta' },
  { id: 'historial', label: 'Historial de deudas' },
]

export default function PagosPage() {
  const { token } = useAuth()
  const [searchParams] = useSearchParams()

  const [casas, setCasas] = useState([])
  const [manzanaInput, setManzanaInput] = useState('')
  const [loteInput, setLoteInput] = useState('')
  const [casaActiva, setCasaActiva] = useState(null)
  const [tab, setTab] = useState('cuenta')

  const [cuenta, setCuenta] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [deudasSeleccionadas, setDeudasSeleccionadas] = useState([])
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null)
  const [deudasCobro, setDeudasCobro] = useState(null)
  const [eximirMoraPorDeuda, setEximirMoraPorDeuda] = useState({})
  const [montoRecibido, setMontoRecibido] = useState('')
  const [observacionesRecibo, setObservacionesRecibo] = useState('')
  const [moraDefecto, setMoraDefecto] = useState(0)
  const [procesando, setProcesando] = useState(false)

  const [resultadoPago, setResultadoPago] = useState(null)
  const [reciboDetalle, setReciboDetalle] = useState(null)
  const [cargandoRecibo, setCargandoRecibo] = useState(false)
  const [reciboImprimir, setReciboImprimir] = useState(null)

  const [filtroHistorial, setFiltroHistorial] = useState('todas')

  useEffect(() => {
    listarCasas(token)
      .then(setCasas)
      .catch(() => {})
    obtenerConfiguracion(token)
      .then((config) => setMoraDefecto(config.moraDefecto ?? 0))
      .catch(() => {})
  }, [token])

  const historialFiltrado = useMemo(() => {
    return historial.filter((d) => {
      if (filtroHistorial === 'pendientes') return d.estado === 'PENDIENTE'
      if (filtroHistorial === 'pagadas') return d.estado === 'PAGADA'
      return true
    })
  }, [historial, filtroHistorial])

  const cargarCasa = useCallback(
    async (casa) => {
      setLoading(true)
      setError('')
      setMensaje('')
      setCuenta(null)
      setHistorial([])
      setDeudasSeleccionadas([])
      setServicioSeleccionado(null)

      try {
        const [cuentaData, historialData] = await Promise.all([
          estadoCuenta(token, casa.codigoCasa),
          obtenerDeudasCasa(token, casa.id),
        ])

        setCasaActiva(casa)
        setManzanaInput(casa.manzana ?? '')
        setLoteInput(casa.lote ?? '')
        setCuenta(cuentaData)
        setHistorial(historialData)
      } catch (err) {
        setError(err.message ?? 'No se pudo cargar la información')
        setCasaActiva(null)
      } finally {
        setLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    const manzana = searchParams.get('manzana')
    const lote = searchParams.get('lote')
    const codigo = searchParams.get('casa')

    if (manzana && lote) {
      setManzanaInput(manzana)
      setLoteInput(lote)
      buscarCasaPorUbicacion(token, manzana, lote)
        .then((casa) => cargarCasa(casa))
        .catch((err) =>
          setError(err.message ?? 'No se encontró la casa indicada'),
        )
      return
    }

    if (codigo) {
      const casa = casas.find((c) => c.codigoCasa === Number(codigo))
      if (casa) {
        cargarCasa(casa)
      }
    }
  }, [searchParams, cargarCasa, token, casas])

  async function handleBuscar(event) {
    event.preventDefault()

    const manzana = normalizarUbicacion(manzanaInput)
    const lote = normalizarUbicacion(loteInput)

    if (!manzana || !lote) {
      setError('Indique manzana y lote')
      return
    }

    setLoading(true)
    setError('')

    try {
      const casa = await buscarCasaPorUbicacion(token, manzana, lote)
      await cargarCasa(casa)
    } catch (err) {
      setError(err.message ?? 'No se encontró casa con esa manzana y lote')
      setCasaActiva(null)
      setCuenta(null)
      setHistorial([])
    } finally {
      setLoading(false)
    }
  }

  function handleSelectCasa(casaId) {
    const casa = casas.find((c) => String(c.id) === casaId)
    if (casa) {
      cargarCasa(casa)
    }
  }

  function normalizarDeudaPago(deuda) {
    const nombreServicio = deuda.servicio?.nombre ?? deuda.servicio
    const anio = Number(deuda.anio)
    const mes = Number(deuda.mes)
    const monto = Number(deuda.monto)
    const mora = Number(deuda.mora ?? 0)
    const permiteMora =
      deuda.permiteMora ?? !esServicioAgua(nombreServicio)
    const aplicaMoraPorFecha =
      permiteMora && puedeAplicarMora(nombreServicio, anio, mes)

    return {
      id: deuda.id,
      servicio: nombreServicio,
      mes,
      anio,
      monto,
      mora,
      total: deuda.total ?? monto + mora,
      permiteMora,
      aplicaMoraPorFecha,
      moraSugerida: Number(deuda.moraSugerida ?? 0),
    }
  }

  function montoMoraDeuda(deuda) {
    if (moraDefecto > 0) return moraDefecto
    return Number(deuda.mora ?? 0)
  }

  function ordenarDeudas(deudas) {
    return [...deudas].sort(
      (a, b) => a.anio - b.anio || a.mes - b.mes,
    )
  }

  function moraAutomaticaActiva(deuda, omitirMora = false) {
    if (omitirMora || !deuda.aplicaMoraPorFecha) return false
    return montoMoraDeuda(deuda) > 0
  }

  function totalLineaDeuda(deuda, omitirMora = false) {
    const base = Number(deuda.monto)
    const mora = moraAutomaticaActiva(deuda, omitirMora)
      ? montoMoraDeuda(deuda)
      : 0
    return base + mora
  }

  function calcularTotalCobro(deudas, eximirMap = eximirMoraPorDeuda) {
    return deudas.reduce(
      (total, deuda) =>
        total + totalLineaDeuda(deuda, eximirMap[deuda.id]?.eximir),
      0,
    )
  }

  function toggleSeleccion(deuda) {
    const id = deuda.id

    setDeudasSeleccionadas((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id)
        if (next.length === 0) {
          setServicioSeleccionado(null)
        }
        return next
      }

      if (servicioSeleccionado && deuda.servicio !== servicioSeleccionado) {
        setError('Solo puede seleccionar meses del mismo servicio')
        return prev
      }

      if (!servicioSeleccionado) {
        setServicioSeleccionado(deuda.servicio)
      }

      return [...prev, id]
    })
  }

  function abrirCobro(deudasRaw) {
    const lista = ordenarDeudas(
      (Array.isArray(deudasRaw) ? deudasRaw : [deudasRaw]).map(
        normalizarDeudaPago,
      ),
    )
    const servicios = new Set(lista.map((deuda) => deuda.servicio))

    if (servicios.size > 1) {
      setMensaje('Seleccione deudas del mismo servicio para un solo recibo')
      return
    }

    const total = calcularTotalCobro(lista, {})

    setResultadoPago(null)
    setReciboDetalle(null)
    setDeudasCobro(lista)
    setEximirMoraPorDeuda({})
    setMontoRecibido(total > 0 ? total.toFixed(2) : '0')
    setObservacionesRecibo('')
    setMensaje('')
  }

  function abrirCobroSeleccionados() {
    if (!cuenta) return

    const seleccionadas = cuenta.deudasPendientes.filter((deuda) =>
      deudasSeleccionadas.includes(deuda.id),
    )

    if (seleccionadas.length === 0) return
    abrirCobro(seleccionadas)
  }

  function handleEximirMoraDeuda(deudaId, checked) {
    setEximirMoraPorDeuda((prev) => {
      const next = { ...prev }

      if (checked) {
        next[deudaId] = { eximir: true, motivo: prev[deudaId]?.motivo ?? '' }
      } else {
        delete next[deudaId]
      }

      if (deudasCobro) {
        const total = calcularTotalCobro(deudasCobro, next)
        setMontoRecibido(total > 0 ? total.toFixed(2) : '0')
      }

      return next
    })
  }

  function handleMotivoExencionDeuda(deudaId, motivo) {
    setEximirMoraPorDeuda((prev) => ({
      ...prev,
      [deudaId]: { eximir: true, motivo },
    }))
  }

  async function handleRegistrarPago(event) {
    event.preventDefault()
    if (!deudasCobro?.length) return

    const exenciones = deudasCobro
      .filter((deuda) => eximirMoraPorDeuda[deuda.id]?.eximir)
      .map((deuda) => ({
        deudaId: deuda.id,
        motivo: eximirMoraPorDeuda[deuda.id]?.motivo?.trim() ?? '',
      }))

    if (exenciones.some((item) => !item.motivo)) {
      setMensaje('Indique el motivo para eximir la mora en cada periodo')
      return
    }

    setProcesando(true)
    setMensaje('')

    try {
      const payload = {
        deudaIds: deudasCobro.map((deuda) => deuda.id),
        montoRecibido: Number(montoRecibido),
      }

      if (exenciones.length) {
        payload.exencionesMora = exenciones
      }

      const obs = observacionesRecibo.trim()
      if (obs) {
        payload.observaciones = obs
      }

      const data = await registrarPago(token, payload)
      setResultadoPago(data)
      setDeudasCobro(null)
      setDeudasSeleccionadas([])
      setServicioSeleccionado(null)
      if (casaActiva) {
        await cargarCasa(casaActiva)
      }
    } catch (err) {
      setMensaje(err.message ?? 'No se pudo registrar el pago')
    } finally {
      setProcesando(false)
    }
  }

  async function verRecibo(numeroRecibo) {
    setResultadoPago(null)
    setCargandoRecibo(true)
    try {
      const data = await obtenerRecibo(token, numeroRecibo)
      setReciboDetalle(data)
    } catch (err) {
      setError(err.message ?? 'No se pudo cargar el recibo')
    } finally {
      setCargandoRecibo(false)
    }
  }

  const totalPagoActual = deudasCobro
    ? calcularTotalCobro(deudasCobro)
    : 0

  return (
    <>
      <PageHeader
        title="Consulta y pagos"
        description="Consulta por manzana y lote, y registro de cobros"
      />

      {mensaje && !deudasCobro && (
        <Alert type="error" className="mb-6" onClose={() => setMensaje('')}>
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
        className="mb-6 rounded-2xl border border-cocode-mint/30 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <FormField label="Manzana" id="manzanaCasa">
            <input
              id="manzanaCasa"
              type="text"
              inputMode="numeric"
              value={manzanaInput}
              onChange={(e) => setManzanaInput(e.target.value)}
              className={inputClassName}
              placeholder="Ej. 5"
            />
          </FormField>

          <FormField label="Lote" id="loteCasa">
            <input
              id="loteCasa"
              type="text"
              inputMode="numeric"
              value={loteInput}
              onChange={(e) => setLoteInput(e.target.value)}
              className={inputClassName}
              placeholder="Ej. 12"
            />
          </FormField>

          <FormField label="O seleccionar casa" id="selectCasa">
            <select
              id="selectCasa"
              value={casaActiva?.id ?? ''}
              onChange={(e) => handleSelectCasa(e.target.value)}
              className={selectClassName}
            >
              <option value="">Elegir de la lista…</option>
              {casas.map((casa) => (
                <option key={casa.id} value={casa.id}>
                  {etiquetaCasa(casa)}
                  {casa.propietarioActual ? ` — ${casa.propietarioActual}` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
              {loading ? 'Consultando…' : 'Consultar'}
            </Button>
          </div>
        </div>
      </form>

      {cuenta && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              titulo="Ubicación"
              valor={
                formatearUbicacion(cuenta.casa.manzana, cuenta.casa.lote) ??
                `#${cuenta.casa.codigoCasa}`
              }
              detalle={cuenta.casa.direccion}
            />
            <InfoCard
              titulo="Propietario"
              valor={cuenta.casa.propietario || '—'}
              accent="sky"
            />
            <InfoCard
              titulo="Total pendiente"
              valor={formatQuetzales(cuenta.totalPendiente)}
              accent="coral"
            />
            <InfoCard
              titulo="Deudas pendientes"
              valor={cuenta.deudasPendientes.length}
              accent="gold"
            />
          </div>

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
        </>
      )}

      {tab === 'cuenta' && cuenta && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-cocode-heading">
              Deudas pendientes de cobro
            </h2>
            {deudasSeleccionadas.length > 0 && (
              <Button onClick={abrirCobroSeleccionados}>
                Cobrar {deudasSeleccionadas.length} mes
                {deudasSeleccionadas.length === 1 ? '' : 'es'} en un recibo
              </Button>
            )}
          </div>

          {servicioSeleccionado && (
            <p className="mb-3 text-sm text-cocode-text/70">
              Seleccionando meses de{' '}
              <strong className="text-cocode-heading">{servicioSeleccionado}</strong>
              . Un recibo solo puede incluir un servicio.
            </p>
          )}

          {cuenta.deudasPendientes.length === 0 ? (
            <div className="rounded-2xl border border-cocode-mint/30 bg-white/80 p-8 text-center text-sm text-cocode-text/70">
              Esta casa no tiene deudas pendientes
            </div>
          ) : (
            <div className="surface-table">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                      <th className="px-4 py-3 font-semibold">
                        <span className="sr-only">Seleccionar</span>
                      </th>
                      <th className="px-4 py-3 font-semibold">Periodo</th>
                      <th className="px-4 py-3 font-semibold">Servicio</th>
                      <th className="px-4 py-3 font-semibold">Monto</th>
                      <th className="px-4 py-3 font-semibold">Mora</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                      <th className="px-4 py-3 font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuenta.deudasPendientes.map((deuda) => {
                      const bloqueada =
                        servicioSeleccionado &&
                        deuda.servicio !== servicioSeleccionado

                      return (
                        <tr
                          key={deuda.id}
                          className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                            bloqueada ? 'opacity-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={deudasSeleccionadas.includes(deuda.id)}
                              disabled={bloqueada}
                              onChange={() => toggleSeleccion(deuda)}
                              className="h-4 w-4 rounded accent-cocode-mint-deep"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-cocode-heading">
                            {formatPeriodo(deuda.mes, deuda.anio)}
                          </td>
                          <td className="px-4 py-3">
                            {deuda.servicio}
                            {deuda.esExtra && (
                              <span className="ml-2 rounded-full bg-cocode-gold/30 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-cocode-heading uppercase">
                                Extra
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">{formatQuetzales(deuda.monto)}</td>
                          <td className="px-4 py-3">{formatQuetzales(deuda.mora)}</td>
                          <td className="px-4 py-3 font-semibold text-cocode-heading">
                            {formatQuetzales(deuda.total)}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              onClick={() => abrirCobro(deuda)}
                            >
                              Cobrar
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'historial' && cuenta && (
        <section>
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { value: 'todas', label: 'Todas' },
              { value: 'pendientes', label: 'Pendientes' },
              { value: 'pagadas', label: 'Pagadas' },
            ].map((opcion) => (
              <button
                key={opcion.value}
                type="button"
                onClick={() => setFiltroHistorial(opcion.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filtroHistorial === opcion.value
                    ? 'bg-cocode-mint/40 text-cocode-heading'
                    : 'bg-white text-cocode-text/70 hover:bg-cocode-mint/15'
                }`}
              >
                {opcion.label}
              </button>
            ))}
          </div>

          {historialFiltrado.length === 0 ? (
            <div className="rounded-2xl border border-cocode-mint/30 bg-white/80 p-8 text-center text-sm text-cocode-text/70">
              Sin registros en este filtro
            </div>
          ) : (
            <div className="surface-table">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                      <th className="px-4 py-3 font-semibold">Periodo</th>
                      <th className="px-4 py-3 font-semibold">Servicio</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialFiltrado.map((deuda) => (
                      <tr
                        key={deuda.id}
                        className="border-b border-cocode-mint/10 hover:bg-cocode-cream/60"
                      >
                        <td className="px-4 py-3 font-medium text-cocode-heading">
                          {nombreMes(deuda.mes)} {deuda.anio}
                        </td>
                        <td className="px-4 py-3">
                          {deuda.servicio?.nombre ?? deuda.servicio}
                          {deuda.esExtra && (
                            <span className="ml-2 rounded-full bg-cocode-gold/30 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-cocode-heading uppercase">
                              Extra
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {formatQuetzales(totalDeuda(deuda))}
                        </td>
                        <td className="px-4 py-3">
                          <EstadoBadge estado={deuda.estado} />
                        </td>
                        <td className="px-4 py-3">
                          {deuda.estado === 'PENDIENTE' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => abrirCobro(deuda)}
                            >
                              Cobrar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {!cuenta && !loading && (
        <div className="rounded-2xl border border-dashed border-cocode-mint/40 bg-white/50 p-12 text-center text-sm text-cocode-text/70">
          Ingresa manzana y lote para consultar deudas y registrar pagos
        </div>
      )}

      <Modal
        open={Boolean(deudasCobro?.length)}
        title={
          deudasCobro?.length > 1
            ? `Cobrar ${deudasCobro.length} meses en un recibo`
            : 'Registrar pago'
        }
        onClose={() => {
          setDeudasCobro(null)
          setMensaje('')
        }}
      >
        {deudasCobro?.length > 0 && (
          <>
            {mensaje && (
              <Alert type="error" className="mb-4" onClose={() => setMensaje('')}>
                {mensaje}
              </Alert>
            )}

            <div className="mb-5 rounded-2xl border border-cocode-sky/40 bg-cocode-sky/15 p-4 text-sm">
              <p className="mb-3">
                <span className="text-cocode-text/70">Servicio:</span>{' '}
                <strong className="text-cocode-heading">
                  {deudasCobro[0].servicio}
                </strong>
              </p>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-cocode-sky/30 text-xs uppercase text-cocode-text/70">
                      <th className="py-2 pr-3">Periodo</th>
                      <th className="py-2 pr-3">Monto</th>
                      <th className="py-2 pr-3">Mora</th>
                      <th className="py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deudasCobro.map((deuda) => {
                      const eximir = eximirMoraPorDeuda[deuda.id]?.eximir
                      const mora = moraAutomaticaActiva(deuda, eximir)
                        ? montoMoraDeuda(deuda)
                        : 0

                      return (
                        <tr
                          key={deuda.id}
                          className="border-b border-cocode-sky/20"
                        >
                          <td className="py-2 pr-3 font-medium text-cocode-heading">
                            {formatPeriodo(deuda.mes, deuda.anio)}
                          </td>
                          <td className="py-2 pr-3">
                            {formatQuetzales(deuda.monto)}
                          </td>
                          <td className="py-2 pr-3">
                            {formatQuetzales(mora)}
                          </td>
                          <td className="py-2 font-semibold text-cocode-heading">
                            {formatQuetzales(totalLineaDeuda(deuda, eximir))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-4">
                <span className="text-cocode-text/70">Total a cancelar:</span>{' '}
                <strong className="text-lg text-cocode-heading">
                  {formatQuetzales(totalPagoActual)}
                </strong>
              </p>
            </div>

            <form onSubmit={handleRegistrarPago} className="space-y-4">
              {deudasCobro.some(
                (deuda) =>
                  deuda.permiteMora &&
                  deuda.aplicaMoraPorFecha &&
                  montoMoraDeuda(deuda) > 0,
              ) && (
                <div className="space-y-3 rounded-2xl border border-cocode-gold/40 bg-cocode-gold/20 p-4">
                  <p className="text-sm font-semibold text-cocode-heading">
                    Eximir mora por periodo
                  </p>
                  {deudasCobro.map((deuda) => {
                    if (
                      !deuda.permiteMora ||
                      !deuda.aplicaMoraPorFecha ||
                      montoMoraDeuda(deuda) <= 0
                    ) {
                      return null
                    }

                    const eximir = eximirMoraPorDeuda[deuda.id]?.eximir

                    return (
                      <div
                        key={deuda.id}
                        className="rounded-xl border border-cocode-gold/30 bg-white/60 p-3"
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={Boolean(eximir)}
                            onChange={(e) =>
                              handleEximirMoraDeuda(deuda.id, e.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded accent-cocode-mint-deep"
                          />
                          <span className="text-sm text-cocode-heading">
                            Eximir mora de{' '}
                            {formatPeriodo(deuda.mes, deuda.anio)} (
                            {formatQuetzales(montoMoraDeuda(deuda))})
                          </span>
                        </label>
                        {eximir && (
                          <textarea
                            rows={2}
                            maxLength={300}
                            required
                            value={eximirMoraPorDeuda[deuda.id]?.motivo ?? ''}
                            onChange={(e) =>
                              handleMotivoExencionDeuda(deuda.id, e.target.value)
                            }
                            placeholder="Motivo de exención…"
                            className={`${inputClassName} mt-3 min-h-[72px] resize-y`}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {deudasCobro[0].servicio?.toUpperCase().includes('AGUA') && (
                <p className="rounded-2xl border border-cocode-sky/40 bg-cocode-sky/15 px-4 py-3 text-sm text-cocode-text/80">
                  {textoReglaMora()}
                </p>
              )}

              <FormField
                label="Efectivo recibido (Q)"
                id="montoRecibido"
                hint="Debe ser igual o mayor al total. El cambio se entrega en efectivo."
              >
                <input
                  id="montoRecibido"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className={inputClassName}
                />
              </FormField>

              <FormField
                label="Observaciones (opcional)"
                id="observacionesRecibo"
                hint="Aparecerán en el recibo impreso. Máximo 500 caracteres."
              >
                <textarea
                  id="observacionesRecibo"
                  rows={3}
                  maxLength={500}
                  value={observacionesRecibo}
                  onChange={(e) => setObservacionesRecibo(e.target.value)}
                  placeholder="Ej. Pago en efectivo, referencia, nota para contabilidad…"
                  className={`${inputClassName} min-h-[80px] resize-y`}
                />
              </FormField>

              <div className="mt-6 flex gap-3">
                <Button type="submit" disabled={procesando} className="flex-1">
                  {procesando
                    ? 'Procesando…'
                    : deudasCobro.length > 1
                      ? `Confirmar pago (${deudasCobro.length} meses)`
                      : 'Confirmar pago'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDeudasCobro(null)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* Modal éxito pago — solo si no hay modal de cobro abierto */}
      <Modal
        open={
          Boolean(resultadoPago) &&
          !deudasCobro &&
          !reciboImprimir &&
          !reciboDetalle
        }
        title="Pago registrado"
        onClose={() => setResultadoPago(null)}
      >
        {resultadoPago && (
          <div className="space-y-4">
            <Alert type="success">{resultadoPago.mensaje}</Alert>

            <div className="rounded-2xl border border-cocode-mint/40 bg-cocode-mint/15 p-4 text-sm">
              <p>
                <span className="text-cocode-text/70">N.º recibo:</span>{' '}
                <strong className="font-[family-name:var(--font-display)] text-lg text-cocode-heading">
                  {resultadoPago.numeroRecibo}
                </strong>
              </p>
              {Number(resultadoPago.cambio) > 0 && (
                <p className="mt-2">
                  Cambio en efectivo:{' '}
                  {formatQuetzales(resultadoPago.cambio)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="flex-1 min-w-[140px]"
                onClick={() => setReciboImprimir(resultadoPago.numeroRecibo)}
              >
                Imprimir recibo
              </Button>
              <Button
                variant="secondary"
                className="flex-1 min-w-[120px]"
                disabled={cargandoRecibo}
                onClick={() => verRecibo(resultadoPago.numeroRecibo)}
              >
                {cargandoRecibo ? 'Cargando…' : 'Ver detalle'}
              </Button>
              <Button variant="secondary" onClick={() => setResultadoPago(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal detalle recibo */}
      <Modal
        open={Boolean(reciboDetalle) && !reciboImprimir}
        title="Detalle del recibo"
        onClose={() => setReciboDetalle(null)}
      >
        {reciboDetalle && (
          <div className="space-y-3 text-sm">
            <ReciboLinea label="Recibo" valor={reciboDetalle.numeroRecibo} bold />
            <ReciboLinea
              label="Fecha"
              valor={new Date(reciboDetalle.fecha).toLocaleString('es-GT')}
            />
            <ReciboLinea
              label="Casa"
              valor={`#${reciboDetalle.casa.codigoCasa} — ${reciboDetalle.casa.direccion}`}
            />
            <ReciboLinea
              label="Propietario"
              valor={reciboDetalle.casa.propietario || '—'}
            />
            <ReciboLinea label="Servicio" valor={reciboDetalle.servicio} />
            <ReciboLinea
              label="Periodo"
              valor={
                reciboDetalle.lineas?.length > 1
                  ? `${formatPeriodo(
                      reciboDetalle.periodo.mes,
                      reciboDetalle.periodo.anio,
                    )} — ${formatPeriodo(
                      reciboDetalle.periodo.mesHasta,
                      reciboDetalle.periodo.anioHasta,
                    )} (${reciboDetalle.lineas.length} meses)`
                  : formatPeriodo(
                      reciboDetalle.periodo.mes,
                      reciboDetalle.periodo.anio,
                    )
              }
            />
            {reciboDetalle.lineas?.length > 1 && (
              <div className="rounded-xl border border-cocode-mint/25 bg-cocode-cream/40 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cocode-text/60">
                  Detalle por mes
                </p>
                <ul className="space-y-1 text-sm">
                  {reciboDetalle.lineas.map((linea) => (
                    <li
                      key={`${linea.periodo.mes}-${linea.periodo.anio}`}
                      className="flex justify-between gap-3"
                    >
                      <span>
                        {formatPeriodo(linea.periodo.mes, linea.periodo.anio)}
                      </span>
                      <span className="font-medium text-cocode-heading">
                        {formatQuetzales(linea.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <hr className="border-cocode-mint/25" />
            <ReciboLinea
              label="Monto deuda"
              valor={formatQuetzales(reciboDetalle.detallePago.montoDeuda)}
            />
            <ReciboLinea
              label="Mora"
              valor={formatQuetzales(reciboDetalle.detallePago.mora)}
            />
            <ReciboLinea
              label="Efectivo recibido"
              valor={formatQuetzales(reciboDetalle.detallePago.efectivoRecibido)}
            />
            <ReciboLinea
              label="Total cancelado"
              valor={formatQuetzales(reciboDetalle.detallePago.totalCancelado)}
              bold
            />
            <ReciboLinea label="Cobró" valor={reciboDetalle.usuario} />
            {reciboDetalle.observaciones?.trim() && (
              <ReciboLinea
                label="Observaciones"
                valor={reciboDetalle.observaciones.trim()}
              />
            )}
            <div className="pt-4">
              <Button
                type="button"
                onClick={() =>
                  setReciboImprimir(reciboDetalle.numeroRecibo)
                }
              >
                Imprimir recibo
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ReciboImpresionModal
        open={Boolean(reciboImprimir)}
        numeroRecibo={reciboImprimir}
        token={token}
        datosIniciales={
          reciboDetalle?.numeroRecibo === reciboImprimir
            ? reciboDetalle
            : null
        }
        onClose={() => setReciboImprimir(null)}
      />
    </>
  )
}

function InfoCard({ titulo, valor, detalle, accent = 'mint' }) {
  const accents = {
    mint: 'border-cocode-mint/40 bg-cocode-mint/15',
    coral: 'border-cocode-coral/40 bg-cocode-coral/15',
    sky: 'border-cocode-sky/40 bg-cocode-sky/20',
    gold: 'border-cocode-gold/50 bg-cocode-gold/25',
  }

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${accents[accent]}`}>
      <p className="text-xs text-cocode-text/70">{titulo}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-cocode-heading">
        {valor}
      </p>
      {detalle && (
        <p className="mt-1 text-xs text-cocode-text/60">{detalle}</p>
      )}
    </article>
  )
}

function EstadoBadge({ estado }) {
  const styles = {
    PENDIENTE: 'bg-cocode-coral/35 text-cocode-heading',
    PAGADA: 'bg-cocode-mint/40 text-cocode-heading',
  }
  const labels = { PENDIENTE: 'Pendiente', PAGADA: 'Pagada' }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}
    >
      {labels[estado] ?? estado}
    </span>
  )
}

function ReciboLinea({ label, valor, bold }) {
  return (
    <p className="flex justify-between gap-4">
      <span className="text-cocode-text/70">{label}</span>
      <span
        className={`text-right text-cocode-heading ${bold ? 'font-bold' : 'font-medium'}`}
      >
        {valor}
      </span>
    </p>
  )
}
