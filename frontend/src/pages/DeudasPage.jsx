import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { buscarCasaPorUbicacion, listarCasas } from '../services/casaService'
import { listarServicios } from '../services/servicioService'
import {
  crearCobroExtra,
  eliminarCobroExtra,
  eliminarGeneracionMes,
  generarDeudas,
  listarCobrosExtra,
  listarDeudasPendientes,
  obtenerDeudasCasa,
  resumenPeriodoDeudas,
} from '../services/deudaService'
import {
  etiquetaCasa,
  formatearUbicacion,
  normalizarUbicacion,
} from '../lib/ubicacionCasa'
import {
  formatPeriodo,
  formatQuetzales,
  MESES,
  nombreMes,
  totalDeuda,
} from '../lib/deudaUtils'
import {
  esMesCobroVehicular,
  esServicioSeguridad,
  textoCobroVehicular,
  textoReglaMora,
} from '../lib/reglasCobro'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName, selectClassName } from '../components/ui/FormField'

const TABS = [
  { id: 'generar', label: 'Generación mensual' },
  { id: 'extras', label: 'Cobros extras' },
  { id: 'consulta', label: 'Consulta por casa' },
  { id: 'resumen', label: 'Resumen pendientes' },
]

const hoy = new Date()

function serviciosDefaultGeneracionMensual(servicios) {
  return servicios
    .filter((servicio) => {
      const nombre = String(servicio.nombre).trim().toUpperCase()
      return nombre === 'AGUA' || esServicioSeguridad(servicio.nombre)
    })
    .map((servicio) => servicio.id)
}

export default function DeudasPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState('generar')

  const [casas, setCasas] = useState([])
  const [servicios, setServicios] = useState([])
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [resumenPeriodo, setResumenPeriodo] = useState(null)
  const [cargandoResumen, setCargandoResumen] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  // Generación
  const [mesGen, setMesGen] = useState(hoy.getMonth() + 1)
  const [anioGen, setAnioGen] = useState(hoy.getFullYear())
  const [generando, setGenerando] = useState(false)
  const [confirmGen, setConfirmGen] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [resultadoGen, setResultadoGen] = useState(null)
  const [resultadoEliminar, setResultadoEliminar] = useState(null)

  // Consulta
  const [casaId, setCasaId] = useState('')
  const [deudas, setDeudas] = useState([])
  const [loadingDeudas, setLoadingDeudas] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [filtroAnio, setFiltroAnio] = useState('')

  // Resumen
  const [resumen, setResumen] = useState([])
  const [loadingResumen, setLoadingResumen] = useState(false)

  // Cobros extras
  const [extraManzanaInput, setExtraManzanaInput] = useState('')
  const [extraLoteInput, setExtraLoteInput] = useState('')
  const [extraCasa, setExtraCasa] = useState(null)
  const [extraBuscandoCasa, setExtraBuscandoCasa] = useState(false)
  const [extraServicioId, setExtraServicioId] = useState('')
  const [extraMes, setExtraMes] = useState(hoy.getMonth() + 1)
  const [extraAnio, setExtraAnio] = useState(hoy.getFullYear())
  const [extraMonto, setExtraMonto] = useState('')
  const [extraObservaciones, setExtraObservaciones] = useState('')
  const [guardandoExtra, setGuardandoExtra] = useState(false)
  const [cobrosExtra, setCobrosExtra] = useState([])
  const [loadingExtras, setLoadingExtras] = useState(false)
  const [filtroExtraEstado, setFiltroExtraEstado] = useState('PENDIENTE')
  const [extraAEliminar, setExtraAEliminar] = useState(null)
  const [eliminandoExtra, setEliminandoExtra] = useState(false)

  useEffect(() => {
    listarCasas(token)
      .then(setCasas)
      .catch((err) => setError(err.message ?? 'No se pudieron cargar las casas'))
    listarServicios(token)
      .then((data) => {
        setServicios(data)
        setServiciosSeleccionados(serviciosDefaultGeneracionMensual(data))
      })
      .catch((err) => setError(err.message ?? 'No se pudieron cargar los servicios'))
  }, [token])

  const cargarResumenPeriodo = useCallback(async () => {
    setCargandoResumen(true)
    try {
      const data = await resumenPeriodoDeudas(token, {
        anio: anioGen,
        mes: mesGen,
      })
      setResumenPeriodo(data)
    } catch {
      setResumenPeriodo(null)
    } finally {
      setCargandoResumen(false)
    }
  }, [token, anioGen, mesGen])

  useEffect(() => {
    if (tab === 'generar') cargarResumenPeriodo()
  }, [tab, cargarResumenPeriodo])

  const cargarCobrosExtra = useCallback(async () => {
    setLoadingExtras(true)
    try {
      const data = await listarCobrosExtra(token, {
        estado: filtroExtraEstado === 'TODOS' ? undefined : filtroExtraEstado,
      })
      setCobrosExtra(data)
    } catch (err) {
      setError(err.message ?? 'No se pudieron cargar los cobros extras')
    } finally {
      setLoadingExtras(false)
    }
  }, [token, filtroExtraEstado])

  useEffect(() => {
    if (tab === 'extras') cargarCobrosExtra()
  }, [tab, cargarCobrosExtra])

  useEffect(() => {
    if (!extraServicioId) return
    const servicio = servicios.find((s) => s.id === Number(extraServicioId))
    if (servicio && !extraMonto) {
      setExtraMonto(String(servicio.montoBase))
    }
  }, [extraServicioId, servicios, extraMonto])

  function handleExtraServicioChange(servicioId) {
    setExtraServicioId(servicioId)
    const servicio = servicios.find((s) => s.id === Number(servicioId))
    setExtraMonto(servicio ? String(servicio.montoBase) : '')
  }

  function seleccionarCasaExtra(casa) {
    setExtraCasa(casa)
    setExtraManzanaInput(casa.manzana ?? '')
    setExtraLoteInput(casa.lote ?? '')
    setError('')
  }

  function limpiarCasaExtra() {
    setExtraCasa(null)
    setExtraManzanaInput('')
    setExtraLoteInput('')
  }

  async function handleBuscarCasaExtra(event) {
    event?.preventDefault?.()

    const manzana = normalizarUbicacion(extraManzanaInput)
    const lote = normalizarUbicacion(extraLoteInput)

    if (!manzana || !lote) {
      setError('Indique manzana y lote para buscar la casa')
      return
    }

    setExtraBuscandoCasa(true)
    setError('')

    try {
      const casa = await buscarCasaPorUbicacion(token, manzana, lote)
      seleccionarCasaExtra(casa)
    } catch (err) {
      setExtraCasa(null)
      setError(err.message ?? 'No se encontró casa con esa manzana y lote')
    } finally {
      setExtraBuscandoCasa(false)
    }
  }

  function handleSelectCasaExtra(casaId) {
    if (!casaId) {
      limpiarCasaExtra()
      return
    }

    const casa = casas.find((item) => String(item.id) === casaId)
    if (casa) {
      seleccionarCasaExtra(casa)
    }
  }

  async function handleCrearCobroExtra(e) {
    e.preventDefault()
    setError('')
    setMensaje('')
    setGuardandoExtra(true)
    try {
      await crearCobroExtra(token, {
        casaId: extraCasa.id,
        servicioId: Number(extraServicioId),
        anio: extraAnio,
        mes: extraMes,
        monto: Number(extraMonto),
        observaciones: extraObservaciones.trim() || undefined,
      })
      setMensaje(
        'Cobro extra registrado. La deuda ya aparece en Pagos para esa casa.',
      )
      limpiarCasaExtra()
      setExtraServicioId('')
      setExtraMonto('')
      setExtraObservaciones('')
      await cargarCobrosExtra()
    } catch (err) {
      setError(err.message ?? 'No se pudo registrar el cobro extra')
    } finally {
      setGuardandoExtra(false)
    }
  }

  async function confirmarEliminarExtra() {
    if (!extraAEliminar) return
    setEliminandoExtra(true)
    setError('')
    try {
      await eliminarCobroExtra(token, extraAEliminar.id)
      setMensaje('Cobro extra eliminado')
      setExtraAEliminar(null)
      await cargarCobrosExtra()
    } catch (err) {
      setError(err.message ?? 'No se pudo eliminar el cobro extra')
    } finally {
      setEliminandoExtra(false)
    }
  }

  const casasActivas = useMemo(
    () => casas.filter((c) => c.activo).length,
    [casas],
  )

  const serviciosActivosSeleccionados = useMemo(
    () => servicios.filter((s) => serviciosSeleccionados.includes(s.id)),
    [servicios, serviciosSeleccionados],
  )

  const deudasEstimadasGenerar = useMemo(
    () => casasActivas * serviciosActivosSeleccionados.length,
    [casasActivas, serviciosActivosSeleccionados],
  )

  const incluyeCobroVehicular = useMemo(() => {
    return (
      esMesCobroVehicular(mesGen) &&
      serviciosActivosSeleccionados.some((s) => esServicioSeguridad(s.nombre))
    )
  }, [mesGen, serviciosActivosSeleccionados])

  const resumenPorServicio = useMemo(() => {
    const map = new Map()
    resumenPeriodo?.servicios?.forEach((s) => map.set(s.id, s))
    return map
  }, [resumenPeriodo])

  const totalEliminables = useMemo(() => {
    return serviciosActivosSeleccionados.reduce((total, servicio) => {
      const info = resumenPorServicio.get(servicio.id)
      return total + (info?.eliminables ?? 0)
    }, 0)
  }, [serviciosActivosSeleccionados, resumenPorServicio])

  function toggleServicio(id) {
    setServiciosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function seleccionarTodosServicios() {
    setServiciosSeleccionados(servicios.map((s) => s.id))
  }

  function deseleccionarTodosServicios() {
    setServiciosSeleccionados([])
  }

  const deudasFiltradas = useMemo(() => {
    return deudas.filter((deuda) => {
      if (filtroEstado === 'pendientes' && deuda.estado !== 'PENDIENTE') return false
      if (filtroEstado === 'pagadas' && deuda.estado !== 'PAGADA') return false
      if (filtroAnio && Number(deuda.anio) !== Number(filtroAnio)) return false
      return true
    })
  }, [deudas, filtroEstado, filtroAnio])

  const totalesConsulta = useMemo(() => {
    const pendientes = deudasFiltradas.filter((d) => d.estado === 'PENDIENTE')
    return {
      count: deudasFiltradas.length,
      pendientes: pendientes.length,
      totalPendiente: pendientes.reduce((t, d) => t + totalDeuda(d), 0),
    }
  }, [deudasFiltradas])

  const cargarDeudasCasa = useCallback(
    async (id) => {
      if (!id) {
        setDeudas([])
        return
      }
      setLoadingDeudas(true)
      setError('')
      try {
        const data = await obtenerDeudasCasa(token, id)
        setDeudas(data)
      } catch (err) {
        setError(err.message ?? 'No se pudieron cargar las deudas')
        setDeudas([])
      } finally {
        setLoadingDeudas(false)
      }
    },
    [token],
  )

  const cargarResumen = useCallback(async () => {
    setLoadingResumen(true)
    setError('')
    try {
      const data = await listarDeudasPendientes(token)
      setResumen(data)
    } catch (err) {
      setError(err.message ?? 'No se pudo cargar el resumen')
    } finally {
      setLoadingResumen(false)
    }
  }, [token])

  useEffect(() => {
    if (tab === 'resumen') cargarResumen()
  }, [tab, cargarResumen])

  useEffect(() => {
    if (casaId) cargarDeudasCasa(casaId)
  }, [casaId, cargarDeudasCasa])

  async function handleGenerar() {
    if (serviciosSeleccionados.length === 0) {
      setMensaje('Selecciona al menos un servicio')
      return
    }
    setGenerando(true)
    setMensaje('')
    setResultadoGen(null)
    try {
      const data = await generarDeudas(token, {
        anio: Number(anioGen),
        mes: Number(mesGen),
        servicioIds: serviciosSeleccionados,
      })
      setResultadoGen(data)
      setMensaje(data.mensaje)
      setConfirmGen(false)
      cargarResumenPeriodo()
    } catch (err) {
      setMensaje(err.message ?? 'No se pudieron generar las deudas')
    } finally {
      setGenerando(false)
    }
  }

  async function handleEliminarGeneracion() {
    if (serviciosSeleccionados.length === 0) {
      setMensaje('Selecciona al menos un servicio')
      return
    }
    setEliminando(true)
    setMensaje('')
    setResultadoEliminar(null)
    try {
      const data = await eliminarGeneracionMes(token, {
        anio: Number(anioGen),
        mes: Number(mesGen),
        servicioIds: serviciosSeleccionados,
      })
      setResultadoEliminar(data)
      setMensaje(data.mensaje)
      setConfirmEliminar(false)
      cargarResumenPeriodo()
    } catch (err) {
      setMensaje(err.message ?? 'No se pudo eliminar la generación')
    } finally {
      setEliminando(false)
    }
  }

  function irAConsultaCasa(codigoCasa) {
    const casa = casas.find((c) => c.codigoCasa === codigoCasa)
    if (casa) {
      setCasaId(String(casa.id))
      setTab('consulta')
    }
  }

  const aniosDisponibles = useMemo(() => {
    const set = new Set(deudas.map((d) => d.anio))
    set.add(hoy.getFullYear())
    return Array.from(set).sort((a, b) => b - a)
  }, [deudas])

  return (
    <>
      <PageHeader
        title="Deudas"
        description="Generación mensual, cobros puntuales y consulta por casa"
      />

      {mensaje && tab === 'generar' && (
        <Alert
          type={resultadoGen || resultadoEliminar ? 'success' : 'error'}
          className="mb-6"
          onClose={() => {
            setMensaje('')
            setResultadoGen(null)
            setResultadoEliminar(null)
          }}
        >
          {resultadoGen
            ? `${mensaje}. Se crearon ${resultadoGen.totalGeneradas} deuda(s) nuevas${resultadoGen.totalOmitidas ? ` (${resultadoGen.totalOmitidas} ya existían)` : ''}${resultadoGen.cobroVehicularIncluido ? '. Se incluyó el cobro por vehículos en seguridad y mantenimiento' : ''}.`
            : resultadoEliminar
              ? `${mensaje}. Se eliminaron ${resultadoEliminar.totalEliminadas} deuda(s) pendientes${resultadoEliminar.totalBloqueadas ? ` (${resultadoEliminar.totalBloqueadas} no se pudieron quitar por cobros)` : ''}.`
              : mensaje}
        </Alert>
      )}
      {mensaje && tab === 'extras' && (
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

      {tab === 'generar' && (
        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="rounded-2xl border border-cocode-sky/40 bg-linear-to-br from-white to-cocode-sky/20 p-6 shadow-sm lg:col-span-3">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-cocode-heading">
                Generar deudas del mes
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-cocode-text/80">
                Elige el periodo y los servicios. Se creará una deuda por cada
                casa activa y servicio seleccionado. Si ya existe deuda para ese
                mes, se omite. Se aplican tarifas especiales cuando corresponda.
              </p>

              <p className="mt-3 rounded-xl border border-cocode-sky/40 bg-cocode-sky/15 px-4 py-3 text-sm text-cocode-text/80">
                {textoReglaMora()}
              </p>

              {incluyeCobroVehicular && (
                <p className="mt-3 rounded-xl border border-cocode-gold/40 bg-cocode-gold/20 px-4 py-3 text-sm text-cocode-heading">
                  {textoCobroVehicular()}
                </p>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <FormField label="Mes" id="mesGen">
                  <select
                    id="mesGen"
                    value={mesGen}
                    onChange={(e) => setMesGen(Number(e.target.value))}
                    className={selectClassName}
                  >
                    {MESES.map((mes) => (
                      <option key={mes.value} value={mes.value}>
                        {mes.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Año" id="anioGen">
                  <input
                    id="anioGen"
                    type="number"
                    min="2020"
                    max="2100"
                    value={anioGen}
                    onChange={(e) => setAnioGen(Number(e.target.value))}
                    className={inputClassName}
                  />
                </FormField>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-cocode-heading">
                    Servicios a incluir
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={seleccionarTodosServicios}
                      className="text-xs font-medium text-cocode-green hover:underline"
                    >
                      Todos
                    </button>
                    <span className="text-cocode-text/30">|</span>
                    <button
                      type="button"
                      onClick={deseleccionarTodosServicios}
                      className="text-xs font-medium text-cocode-text/60 hover:underline"
                    >
                      Ninguno
                    </button>
                  </div>
                </div>

                {servicios.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-cocode-mint/40 bg-white/60 p-4 text-sm text-cocode-text/70">
                    No hay servicios registrados. Crea servicios antes de generar deudas.
                  </p>
                ) : (
                  <ul className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-cocode-mint/30 bg-white/80 p-3">
                    {servicios.map((servicio) => {
                      const info = resumenPorServicio.get(servicio.id)
                      const marcado = serviciosSeleccionados.includes(servicio.id)
                      return (
                        <li key={servicio.id}>
                          <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-cocode-mint/10">
                            <input
                              type="checkbox"
                              checked={marcado}
                              onChange={() => toggleServicio(servicio.id)}
                              className="mt-1 h-4 w-4 rounded border-cocode-mint/50 text-cocode-green focus:ring-cocode-green"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-cocode-heading">
                                {servicio.nombre}
                                {servicio.correlativo?.prefijo
                                  ? ` (${servicio.correlativo.prefijo})`
                                  : ''}
                              </span>
                              <span className="text-xs text-cocode-text/60">
                                Tarifa base: {formatQuetzales(servicio.montoBase)}
                                {cargandoResumen
                                  ? ' · consultando periodo…'
                                  : info?.total
                                    ? ` · ${info.total} ya generada(s) (${info.pendientes} pend., ${info.pagadas} pag.)`
                                    : ' · sin deudas en este periodo'}
                              </span>
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <Button
                className="mt-6"
                disabled={
                  serviciosSeleccionados.length === 0 || casasActivas === 0
                }
                onClick={() => setConfirmGen(true)}
              >
                Generar {formatPeriodo(mesGen, anioGen)}
              </Button>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <InfoCard
                titulo="Casas activas"
                valor={casasActivas}
                detalle="Recibirán deuda si no existe para el periodo"
                accent="mint"
              />
              <InfoCard
                titulo="Servicios seleccionados"
                valor={serviciosActivosSeleccionados.length}
                detalle={
                  serviciosActivosSeleccionados.length
                    ? serviciosActivosSeleccionados.map((s) => s.nombre).join(', ')
                    : 'Ninguno seleccionado'
                }
                accent="gold"
              />
              <InfoCard
                titulo="Deudas a crear (aprox.)"
                valor={deudasEstimadasGenerar}
                detalle="Casas activas × servicios marcados (sin duplicar existentes)"
                accent="sky"
              />
              {resumenPeriodo && resumenPeriodo.totalDeudas > 0 && (
                <InfoCard
                  titulo="Ya generadas en el periodo"
                  valor={resumenPeriodo.totalDeudas}
                  detalle={`${totalEliminables} pendiente(s) se pueden revertir`}
                  accent="coral"
                />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-cocode-coral/30 bg-linear-to-br from-white to-cocode-coral/10 p-6 shadow-sm">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-cocode-heading">
              Revertir generación del mes
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-cocode-text/80">
              Si te equivocaste de mes, puedes eliminar las deudas pendientes
              generadas para <strong>{formatPeriodo(mesGen, anioGen)}</strong> en
              los servicios seleccionados arriba. No se eliminan deudas ya
              pagadas ni con cobros registrados.
            </p>

            {cargandoResumen ? (
              <p className="mt-4 text-sm text-cocode-text/60">
                Consultando deudas del periodo…
              </p>
            ) : totalEliminables > 0 ? (
              <p className="mt-4 text-sm text-cocode-heading">
                Hay <strong>{totalEliminables}</strong> deuda(s) pendiente(s)
                eliminable(s) para los servicios marcados.
              </p>
            ) : (
              <p className="mt-4 text-sm text-cocode-text/60">
                No hay deudas pendientes eliminables para ese periodo y servicios.
              </p>
            )}

            <Button
              variant="danger"
              className="mt-6"
              disabled={
                serviciosSeleccionados.length === 0 || totalEliminables === 0
              }
              onClick={() => setConfirmEliminar(true)}
            >
              Eliminar generación de {formatPeriodo(mesGen, anioGen)}
            </Button>
          </div>
        </section>
      )}

      {tab === 'extras' && (
        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-cocode-sky/40 bg-linear-to-br from-white to-cocode-sky/20 p-6 shadow-sm">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-cocode-heading">
                Nuevo cobro extra
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-cocode-text/80">
                Para cargos que no se generan cada mes (reconexión de agua,
                multas, trabajos especiales, etc.). Se crea una deuda solo para
                la casa indicada y queda disponible en{' '}
                <strong>Pagos</strong> para cobrar.
              </p>

              <form onSubmit={handleCrearCobroExtra} className="mt-6 space-y-4">
                <div className="rounded-xl border border-cocode-mint/30 bg-white/70 p-4">
                  <p className="mb-3 text-sm font-semibold text-cocode-heading">
                    Buscar casa por ubicación
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Manzana" id="extraManzana">
                      <input
                        id="extraManzana"
                        type="text"
                        inputMode="numeric"
                        value={extraManzanaInput}
                        onChange={(e) => setExtraManzanaInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleBuscarCasaExtra()
                          }
                        }}
                        className={inputClassName}
                        placeholder="Ej. 5"
                      />
                    </FormField>

                    <FormField label="Lote" id="extraLote">
                      <input
                        id="extraLote"
                        type="text"
                        inputMode="numeric"
                        value={extraLoteInput}
                        onChange={(e) => setExtraLoteInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleBuscarCasaExtra()
                          }
                        }}
                        className={inputClassName}
                        placeholder="Ej. 12"
                      />
                    </FormField>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <Button
                      type="button"
                      disabled={extraBuscandoCasa}
                      onClick={handleBuscarCasaExtra}
                    >
                      {extraBuscandoCasa ? 'Buscando…' : 'Buscar casa'}
                    </Button>

                    <FormField
                      label="O elegir de la lista"
                      id="extraSelectCasa"
                      className="min-w-[200px] flex-1"
                    >
                      <select
                        id="extraSelectCasa"
                        value={extraCasa?.id ?? ''}
                        onChange={(e) => handleSelectCasaExtra(e.target.value)}
                        className={selectClassName}
                      >
                        <option value="">Seleccionar…</option>
                        {casas.map((casa) => (
                          <option key={casa.id} value={casa.id}>
                            {etiquetaCasa(casa)}
                            {casa.propietarioActual
                              ? ` — ${casa.propietarioActual}`
                              : ''}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  {extraCasa && (
                    <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-cocode-mint/40 bg-cocode-mint/15 px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold tracking-wide text-cocode-heading/60 uppercase">
                          Casa seleccionada
                        </p>
                        <p className="mt-1 font-semibold text-cocode-heading">
                          {formatearUbicacion(extraCasa.manzana, extraCasa.lote) ??
                            etiquetaCasa(extraCasa)}
                        </p>
                        {extraCasa.propietarioActual && (
                          <p className="text-sm text-cocode-text/80">
                            {extraCasa.propietarioActual}
                          </p>
                        )}
                        {extraCasa.direccion && (
                          <p className="text-xs text-cocode-text/60">
                            {extraCasa.direccion}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={limpiarCasaExtra}
                      >
                        Cambiar
                      </Button>
                    </div>
                  )}
                </div>

                <FormField label="Servicio" id="extraServicioId">
                  <select
                    id="extraServicioId"
                    required
                    value={extraServicioId}
                    onChange={(e) => handleExtraServicioChange(e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Elegir servicio…</option>
                    {servicios.map((servicio) => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre} (base {formatQuetzales(servicio.montoBase)})
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Mes del cargo" id="extraMes">
                    <select
                      id="extraMes"
                      value={extraMes}
                      onChange={(e) => setExtraMes(Number(e.target.value))}
                      className={selectClassName}
                    >
                      {MESES.map((mes) => (
                        <option key={mes.value} value={mes.value}>
                          {mes.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Año" id="extraAnio">
                    <input
                      id="extraAnio"
                      type="number"
                      min="2020"
                      max="2100"
                      required
                      value={extraAnio}
                      onChange={(e) => setExtraAnio(Number(e.target.value))}
                      className={inputClassName}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Monto (Q)"
                  id="extraMonto"
                  hint="Puede diferir del monto base del servicio"
                >
                  <input
                    id="extraMonto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={extraMonto}
                    onChange={(e) => setExtraMonto(e.target.value)}
                    className={inputClassName}
                  />
                </FormField>

                <FormField
                  label="Observaciones"
                  id="extraObservaciones"
                  hint="Opcional — motivo del cobro"
                >
                  <input
                    id="extraObservaciones"
                    type="text"
                    maxLength={200}
                    value={extraObservaciones}
                    onChange={(e) => setExtraObservaciones(e.target.value)}
                    className={inputClassName}
                    placeholder="Ej. Reconexión por corte de agua"
                  />
                </FormField>

                <Button
                  type="submit"
                  disabled={
                    guardandoExtra ||
                    !extraCasa ||
                    !extraServicioId ||
                    !extraMonto
                  }
                >
                  {guardandoExtra ? 'Guardando…' : 'Registrar cobro extra'}
                </Button>
              </form>
            </div>

            <div className="rounded-2xl border border-cocode-mint/30 bg-white/80 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-cocode-heading">
                ¿Cómo funciona?
              </h3>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-cocode-text/80">
                <li>
                  Crea el servicio en <strong>Servicios</strong> si aún no existe
                  (ej. RECONEXION DE AGUA).
                </li>
                <li>
                  No lo incluyas en la generación mensual; solo se cobra por este
                  módulo.
                </li>
                <li>
                  Una vez registrado, ve a <strong>Pagos</strong>, busca la casa
                  por manzana y lote, y cobra como cualquier otra deuda.
                </li>
                <li>
                  Solo puede haber un cargo del mismo servicio por casa y periodo.
                </li>
              </ul>
            </div>
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-cocode-heading">
                Cobros extras registrados
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'PENDIENTE', label: 'Pendientes' },
                  { value: 'PAGADA', label: 'Pagadas' },
                  { value: 'TODOS', label: 'Todos' },
                ].map((opcion) => (
                  <button
                    key={opcion.value}
                    type="button"
                    onClick={() => setFiltroExtraEstado(opcion.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      filtroExtraEstado === opcion.value
                        ? 'bg-cocode-mint/40 text-cocode-heading'
                        : 'bg-white text-cocode-text/70 hover:bg-cocode-mint/15'
                    }`}
                  >
                    {opcion.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="surface-table">
              {loadingExtras ? (
                <p className="p-8 text-center text-sm text-cocode-text/70">
                  Cargando cobros extras…
                </p>
              ) : cobrosExtra.length === 0 ? (
                <p className="p-8 text-center text-sm text-cocode-text/70">
                  No hay cobros extras con el filtro seleccionado
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                        <th className="px-4 py-3 font-semibold">Casa</th>
                        <th className="px-4 py-3 font-semibold">Servicio</th>
                        <th className="px-4 py-3 font-semibold">Periodo</th>
                        <th className="px-4 py-3 font-semibold">Monto</th>
                        <th className="px-4 py-3 font-semibold">Observaciones</th>
                        <th className="px-4 py-3 font-semibold">Estado</th>
                        <th className="px-4 py-3 font-semibold">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cobrosExtra.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-cocode-heading">
                              {etiquetaCasa(item.casa)}
                            </div>
                            {item.casa?.propietario && (
                              <div className="text-xs text-cocode-text/60">
                                {item.casa.propietario}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">{item.servicio}</td>
                          <td className="px-4 py-3">
                            {nombreMes(item.mes)} {item.anio}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {formatQuetzales(item.total)}
                          </td>
                          <td className="px-4 py-3 text-cocode-text/70">
                            {item.observaciones || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <EstadoDeudaBadge estado={item.estado} />
                          </td>
                          <td className="px-4 py-3">
                            {item.estado === 'PENDIENTE' &&
                            !item.tieneCobros ? (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setExtraAEliminar(item)}
                              >
                                Eliminar
                              </Button>
                            ) : (
                              <span className="text-xs text-cocode-text/50">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'consulta' && (
        <section>
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <FormField label="Seleccionar casa" id="casaId" className="lg:col-span-2">
              <select
                id="casaId"
                value={casaId}
                onChange={(e) => setCasaId(e.target.value)}
                className={selectClassName}
              >
                <option value="">Elegir una casa…</option>
                {casas.map((casa) => (
                  <option key={casa.id} value={casa.id}>
                    #{casa.codigoCasa} — {casa.direccion}
                    {casa.propietarioActual ? ` (${casa.propietarioActual})` : ''}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="flex flex-wrap gap-2 self-end">
              {[
                { value: 'todas', label: 'Todas' },
                { value: 'pendientes', label: 'Pendientes' },
                { value: 'pagadas', label: 'Pagadas' },
              ].map((opcion) => (
                <button
                  key={opcion.value}
                  type="button"
                  onClick={() => setFiltroEstado(opcion.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    filtroEstado === opcion.value
                      ? 'bg-cocode-mint/40 text-cocode-heading'
                      : 'bg-white text-cocode-text/70 hover:bg-cocode-mint/15'
                  }`}
                >
                  {opcion.label}
                </button>
              ))}
            </div>
          </div>

          {casaId && (
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <InfoCard
                titulo="Registros"
                valor={totalesConsulta.count}
                accent="sky"
              />
              <InfoCard
                titulo="Pendientes"
                valor={totalesConsulta.pendientes}
                accent="coral"
              />
              <InfoCard
                titulo="Total pendiente"
                valor={formatQuetzales(totalesConsulta.totalPendiente)}
                accent="gold"
              />
            </div>
          )}

          {aniosDisponibles.length > 0 && casaId && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-cocode-heading/60 uppercase">
                Año:
              </span>
              <button
                type="button"
                onClick={() => setFiltroAnio('')}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  !filtroAnio
                    ? 'bg-cocode-mint/40 text-cocode-heading'
                    : 'bg-white text-cocode-text/70'
                }`}
              >
                Todos
              </button>
              {aniosDisponibles.map((anio) => (
                <button
                  key={anio}
                  type="button"
                  onClick={() => setFiltroAnio(String(anio))}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    filtroAnio === String(anio)
                      ? 'bg-cocode-mint/40 text-cocode-heading'
                      : 'bg-white text-cocode-text/70'
                  }`}
                >
                  {anio}
                </button>
              ))}
            </div>
          )}

          <TablaDeudas
            deudas={deudasFiltradas}
            loading={loadingDeudas}
            vacio={!casaId}
            mensajeVacio="Selecciona una casa para ver sus deudas"
          />
        </section>
      )}

      {tab === 'resumen' && (
        <section>
          <p className="mb-6 text-sm text-cocode-text/80">
            Casas activas con al menos una deuda pendiente, ordenadas por monto
            adeudado.
          </p>

          <div className="surface-table">
            {loadingResumen ? (
              <p className="p-8 text-center text-sm text-cocode-text/70">
                Cargando resumen…
              </p>
            ) : resumen.length === 0 ? (
              <p className="p-8 text-center text-sm text-cocode-text/70">
                No hay deudas pendientes registradas
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                      <th className="px-4 py-3 font-semibold">Código</th>
                      <th className="px-4 py-3 font-semibold">Propietario</th>
                      <th className="px-4 py-3 font-semibold">Deudas</th>
                      <th className="px-4 py-3 font-semibold">Total pendiente</th>
                      <th className="px-4 py-3 font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.map((item) => (
                      <tr
                        key={item.codigoCasa}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-semibold text-cocode-heading">
                          #{item.codigoCasa}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-cocode-heading">
                            {item.propietario || '—'}
                          </p>
                          <p className="text-xs text-cocode-text/60">
                            {item.direccion}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-cocode-text">
                          {item.cantidadDeudas}
                        </td>
                        <td className="px-4 py-3 font-semibold text-cocode-heading">
                          {formatQuetzales(item.totalPendiente)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => irAConsultaCasa(item.codigoCasa)}
                          >
                            Ver detalle
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      <Modal
        open={confirmGen}
        title="Confirmar generación"
        onClose={() => setConfirmGen(false)}
      >
        <p className="text-sm leading-relaxed text-cocode-text/80">
          ¿Generar las deudas de{' '}
          <strong className="text-cocode-heading">
            {formatPeriodo(mesGen, anioGen)}
          </strong>{' '}
          para las <strong>{casasActivas}</strong> casa(s) activa(s) en{' '}
          <strong>{serviciosActivosSeleccionados.length}</strong> servicio(s)?
        </p>
        <ul className="mt-3 list-inside list-disc text-xs text-cocode-text/70">
          {serviciosActivosSeleccionados.map((s) => (
            <li key={s.id}>{s.nombre}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-cocode-text/60">
          Hasta {deudasEstimadasGenerar} deuda(s) nuevas. Las ya existentes para
          ese mes no se duplicarán.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            className="flex-1"
            disabled={generando}
            onClick={handleGenerar}
          >
            {generando ? 'Generando…' : 'Sí, generar'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setConfirmGen(false)}
            disabled={generando}
          >
            Cancelar
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(extraAEliminar)}
        title="Eliminar cobro extra"
        onClose={() => setExtraAEliminar(null)}
      >
        <p className="text-sm text-cocode-text/80">
          ¿Eliminar el cobro extra de{' '}
          <strong>{extraAEliminar?.servicio}</strong> para{' '}
          <strong>{extraAEliminar && etiquetaCasa(extraAEliminar.casa)}</strong>
          ? La deuda pendiente dejará de aparecer en Pagos.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="danger"
            disabled={eliminandoExtra}
            onClick={confirmarEliminarExtra}
          >
            {eliminandoExtra ? 'Eliminando…' : 'Sí, eliminar'}
          </Button>
          <Button variant="secondary" onClick={() => setExtraAEliminar(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmEliminar}
        title="Confirmar eliminación"
        onClose={() => setConfirmEliminar(false)}
      >
        <p className="text-sm leading-relaxed text-cocode-text/80">
          ¿Eliminar la generación de{' '}
          <strong className="text-cocode-heading">
            {formatPeriodo(mesGen, anioGen)}
          </strong>{' '}
          para los servicios seleccionados?
        </p>
        <p className="mt-3 text-sm text-cocode-coral">
          Se quitarán hasta <strong>{totalEliminables}</strong> deuda(s)
          pendiente(s). Las deudas pagadas o con cobros no se tocarán.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            disabled={eliminando}
            onClick={handleEliminarGeneracion}
          >
            {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setConfirmEliminar(false)}
            disabled={eliminando}
          >
            Cancelar
          </Button>
        </div>
      </Modal>
    </>
  )
}

function TablaDeudas({ deudas, loading, vacio, mensajeVacio }) {
  if (vacio) {
    return (
      <div className="rounded-2xl border border-dashed border-cocode-mint/40 bg-white/50 p-12 text-center text-sm text-cocode-text/70">
        {mensajeVacio}
      </div>
    )
  }

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-cocode-text/70">
        Cargando deudas…
      </p>
    )
  }

  if (deudas.length === 0) {
    return (
      <div className="rounded-2xl border border-cocode-mint/30 bg-white/80 p-8 text-center text-sm text-cocode-text/70">
        No hay deudas con los filtros seleccionados
      </div>
    )
  }

  return (
    <div className="surface-table">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
              <th className="px-4 py-3 font-semibold">Periodo</th>
              <th className="px-4 py-3 font-semibold">Servicio</th>
              <th className="px-4 py-3 font-semibold">Monto</th>
              <th className="px-4 py-3 font-semibold">Mora</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {deudas.map((deuda) => (
              <tr
                key={deuda.id}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium text-cocode-heading">
                  {nombreMes(deuda.mes)} {deuda.anio}
                </td>
                <td className="px-4 py-3 text-cocode-text">
                  {deuda.servicio?.nombre ?? deuda.servicio}
                  {deuda.esExtra && (
                    <span className="ml-2 rounded-full bg-cocode-gold/30 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-cocode-heading uppercase">
                      Extra
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{formatQuetzales(deuda.monto)}</td>
                <td className="px-4 py-3">{formatQuetzales(deuda.mora)}</td>
                <td className="px-4 py-3 font-semibold text-cocode-heading">
                  {formatQuetzales(totalDeuda(deuda))}
                </td>
                <td className="px-4 py-3">
                  <EstadoDeudaBadge estado={deuda.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EstadoDeudaBadge({ estado }) {
  const styles = {
    PENDIENTE: 'bg-cocode-coral/35 text-cocode-heading',
    PAGADA: 'bg-cocode-mint/40 text-cocode-heading',
  }
  const labels = { PENDIENTE: 'Pendiente', PAGADA: 'Pagada' }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado] ?? 'bg-cocode-sky/30'}`}
    >
      {labels[estado] ?? estado}
    </span>
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
    <article
      className={`rounded-2xl border p-5 shadow-sm ${accents[accent]}`}
    >
      <p className="text-sm text-cocode-text/70">{titulo}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-cocode-heading">
        {valor}
      </p>
      {detalle && (
        <p className="mt-2 text-xs text-cocode-text/60">{detalle}</p>
      )}
    </article>
  )
}
