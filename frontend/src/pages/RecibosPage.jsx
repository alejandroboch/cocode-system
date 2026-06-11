import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  anularRecibo,
  listarRecibos,
  obtenerRecibo,
} from '../services/reciboService'
import { formatPeriodo, formatQuetzales } from '../lib/deudaUtils'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ReciboImpresionModal from '../components/recibo/ReciboImpresionModal'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName } from '../components/ui/FormField'

const FILTROS_ESTADO = [
  { value: 'todos', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'ANULADO', label: 'Anulados' },
]

export default function RecibosPage() {
  const { token } = useAuth()

  const [recibos, setRecibos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [reciboImprimir, setReciboImprimir] = useState(null)

  const [anularTarget, setAnularTarget] = useState(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [anulando, setAnulando] = useState(false)

  const cargarRecibos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listarRecibos(token, {
        estado: filtroEstado,
        q: busqueda.trim() || undefined,
      })
      setRecibos(data)
    } catch (err) {
      setError(err.message ?? 'No se pudieron cargar los recibos')
    } finally {
      setLoading(false)
    }
  }, [token, filtroEstado, busqueda])

  useEffect(() => {
    cargarRecibos()
  }, [cargarRecibos])

  const resumen = useMemo(() => {
    const activos = recibos.filter((r) => r.estado === 'ACTIVO').length
    const anulados = recibos.filter((r) => r.estado === 'ANULADO').length
    return { activos, anulados, total: recibos.length }
  }, [recibos])

  async function verDetalle(numeroRecibo) {
    setCargandoDetalle(true)
    setDetalle(null)
    try {
      const data = await obtenerRecibo(token, numeroRecibo)
      setDetalle(data)
    } catch (err) {
      setError(err.message ?? 'No se pudo cargar el recibo')
    } finally {
      setCargandoDetalle(false)
    }
  }

  async function handleAnular(event) {
    event.preventDefault()
    if (!anularTarget || !motivoAnulacion.trim()) return

    setAnulando(true)
    setMensaje('')

    try {
      const data = await anularRecibo(
        token,
        anularTarget.numeroRecibo,
        motivoAnulacion.trim(),
      )
      setMensaje(data.mensaje)
      setAnularTarget(null)
      setMotivoAnulacion('')
      setReciboImprimir(null)
      if (detalle?.numeroRecibo === anularTarget.numeroRecibo) {
        setDetalle((prev) =>
          prev ? { ...prev, estado: 'ANULADO' } : prev,
        )
      }
      cargarRecibos()
    } catch (err) {
      setMensaje(err.message ?? 'No se pudo anular el recibo')
    } finally {
      setAnulando(false)
    }
  }

  function handleBuscar(event) {
    event.preventDefault()
    cargarRecibos()
  }

  return (
    <>
      <PageHeader
        title="Recibos"
        description="Consulta, detalle y anulación de recibos emitidos"
      />

      {mensaje && !anularTarget && (
        <Alert type="success" className="mb-6" onClose={() => setMensaje('')}>
          {mensaje}
          <span className="mt-2 block text-sm opacity-90">
            La deuda quedó pendiente de nuevo. Puedes cobrarla en{' '}
            <Link to="/pagos" className="font-semibold underline">
              Pagos
            </Link>
            .
          </span>
        </Alert>
      )}
      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MiniStat label="En lista" valor={resumen.total} accent="sky" />
        <MiniStat label="Activos" valor={resumen.activos} accent="mint" />
        <MiniStat label="Anulados" valor={resumen.anulados} accent="coral" />
      </div>

      <form
        onSubmit={handleBuscar}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <FormField label="Buscar" id="busqueda" className="flex-1">
          <input
            id="busqueda"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="N.º recibo, código casa, propietario o servicio…"
            className={inputClassName}
          />
        </FormField>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTROS_ESTADO.map((opcion) => (
          <button
            key={opcion.value}
            type="button"
            onClick={() => setFiltroEstado(opcion.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filtroEstado === opcion.value
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
            Cargando recibos…
          </p>
        ) : recibos.length === 0 ? (
          <p className="p-8 text-center text-sm text-cocode-text/70">
            No hay recibos con estos filtros
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  <th className="px-4 py-3 font-semibold">Recibo</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Casa</th>
                  <th className="px-4 py-3 font-semibold">Servicio</th>
                  <th className="px-4 py-3 font-semibold">Periodo</th>
                  <th className="px-4 py-3 font-semibold">Monto</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recibos.map((recibo) => (
                  <tr
                    key={recibo.numeroRecibo}
                    className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                      recibo.estado === 'ANULADO' ? 'opacity-75' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-cocode-heading">
                      {recibo.numeroRecibo}
                    </td>
                    <td className="px-4 py-3 text-cocode-text/80">
                      {formatFecha(recibo.fechaEmision)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-cocode-heading">
                        #{recibo.codigoCasa}
                      </p>
                      <p className="text-xs text-cocode-text/60">
                        {recibo.propietario || recibo.direccion}
                      </p>
                    </td>
                    <td className="px-4 py-3">{recibo.servicio}</td>
                    <td className="px-4 py-3">
                      {recibo.periodo ||
                        formatPeriodo(recibo.mes, recibo.anio)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-cocode-heading">
                      {formatQuetzales(recibo.monto)}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoReciboBadge estado={recibo.estado} />
                      {recibo.estado === 'ANULADO' && (
                          <p className="mt-1 text-xs text-cocode-mint-deep">
                            Deudas reactivadas
                          </p>
                        )}
                    </td>
                    <td className="px-4 py-3 min-w-[240px]">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="sm:min-w-[88px]"
                          onClick={() => verDetalle(recibo.numeroRecibo)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          className="sm:min-w-[88px]"
                          variant={
                            recibo.estado === 'ANULADO'
                              ? 'secondary'
                              : 'primary'
                          }
                          onClick={() =>
                            setReciboImprimir(recibo.numeroRecibo)
                          }
                        >
                          Imprimir
                        </Button>
                        {recibo.estado === 'ACTIVO' && (
                          <Button
                            size="sm"
                            variant="danger"
                            className="sm:min-w-[88px]"
                            onClick={() => {
                              setAnularTarget(recibo)
                              setMotivoAnulacion('')
                              setMensaje('')
                            }}
                          >
                            Anular
                          </Button>
                        )}
                        {recibo.estado === 'ANULADO' && (
                            <Link
                              to={
                                recibo.manzana && recibo.lote
                                  ? `/pagos?manzana=${recibo.manzana}&lote=${recibo.lote}`
                                  : `/pagos?casa=${recibo.codigoCasa}`
                              }
                              className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-cocode-mint bg-cocode-mint/30 px-3 py-2 text-xs font-semibold text-cocode-heading transition hover:border-cocode-mint-deep/30 hover:bg-cocode-mint/50 sm:min-w-[88px]"
                            >
                              Cobrar
                            </Link>
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
        open={Boolean(detalle) || cargandoDetalle}
        title="Detalle del recibo"
        onClose={() => {
          setDetalle(null)
          setCargandoDetalle(false)
        }}
        size="lg"
      >
        {cargandoDetalle && (
          <p className="text-sm text-cocode-text/70">Cargando…</p>
        )}
        {detalle && (
          <div className="space-y-3 text-sm">
            <DetalleLinea label="N.º recibo" valor={detalle.numeroRecibo} bold />
            <DetalleLinea
              label="Estado"
              valor={detalle.estado === 'ACTIVO' ? 'Activo' : 'Anulado'}
            />
            <DetalleLinea
              label="Fecha emisión"
              valor={formatFecha(detalle.fecha)}
            />
            <DetalleLinea
              label="Casa"
              valor={`#${detalle.casa.codigoCasa} — ${detalle.casa.direccion}`}
            />
            <DetalleLinea
              label="Propietario"
              valor={detalle.casa.propietario || '—'}
            />
            <DetalleLinea label="Servicio" valor={detalle.servicio} />
            <DetalleLinea
              label="Periodo"
              valor={
                detalle.lineas?.length > 1
                  ? `${formatPeriodo(
                      detalle.periodo.mes,
                      detalle.periodo.anio,
                    )} — ${formatPeriodo(
                      detalle.periodo.mesHasta,
                      detalle.periodo.anioHasta,
                    )} (${detalle.lineas.length} meses)`
                  : formatPeriodo(
                      detalle.periodo.mes,
                      detalle.periodo.anio,
                    )
              }
            />
            {detalle.lineas?.length > 1 && (
              <div className="rounded-xl border border-cocode-mint/25 bg-cocode-cream/40 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cocode-text/60">
                  Detalle por mes
                </p>
                <ul className="space-y-1">
                  {detalle.lineas.map((linea) => (
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
            <DetalleLinea
              label="Monto deuda"
              valor={formatQuetzales(detalle.detallePago.montoDeuda)}
            />
            <DetalleLinea
              label="Mora"
              valor={formatQuetzales(detalle.detallePago.mora)}
            />
            <DetalleLinea
              label="Efectivo recibido"
              valor={formatQuetzales(detalle.detallePago.efectivoRecibido)}
            />
            <DetalleLinea
              label="Total cancelado"
              valor={formatQuetzales(detalle.detallePago.totalCancelado)}
              bold
            />
            <DetalleLinea label="Cobró" valor={detalle.usuario} />
            {detalle.observaciones?.trim() && (
              <DetalleLinea
                label="Observaciones"
                valor={detalle.observaciones.trim()}
              />
            )}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                type="button"
                variant={
                  detalle.estado === 'ANULADO' ? 'secondary' : 'primary'
                }
                onClick={() => setReciboImprimir(detalle.numeroRecibo)}
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
          detalle?.numeroRecibo === reciboImprimir ? detalle : null
        }
        onClose={() => setReciboImprimir(null)}
      />

      <Modal
        open={Boolean(anularTarget)}
        title="Anular recibo"
        onClose={() => {
          setAnularTarget(null)
          setMotivoAnulacion('')
        }}
      >
        {anularTarget && (
          <>
            {mensaje && (
              <Alert type="error" className="mb-4" onClose={() => setMensaje('')}>
                {mensaje}
              </Alert>
            )}

            <div className="mb-4 rounded-2xl border border-cocode-coral/35 bg-cocode-coral/15 p-4 text-sm">
              <p>
                Recibo:{' '}
                <strong className="text-cocode-heading">
                  {anularTarget.numeroRecibo}
                </strong>
              </p>
              <p className="mt-1">
                Casa #{anularTarget.codigoCasa} · {anularTarget.servicio} ·{' '}
                {anularTarget.periodo ||
                  formatPeriodo(anularTarget.mes, anularTarget.anio)}
              </p>
              <p className="mt-3 text-cocode-text/80">
                Al anular, las deudas del recibo volverán a estado{' '}
                <strong>pendiente</strong> y podrás cobrarlas nuevamente en
                Pagos.
              </p>
            </div>

            <form onSubmit={handleAnular}>
              <FormField
                label="Motivo de anulación"
                id="motivo"
                hint="Obligatorio para dejar constancia"
              >
                <textarea
                  id="motivo"
                  required
                  rows={3}
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  className={inputClassName}
                  placeholder="Ej. Error en el monto registrado"
                />
              </FormField>

              <div className="mt-6 flex gap-3">
                <Button
                  type="submit"
                  variant="danger"
                  disabled={anulando}
                  className="flex-1"
                >
                  {anulando ? 'Anulando…' : 'Confirmar anulación'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAnularTarget(null)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </>
  )
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-GT', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function EstadoReciboBadge({ estado }) {
  const styles = {
    ACTIVO: 'bg-cocode-mint/40 text-cocode-heading',
    ANULADO: 'bg-cocode-coral/35 text-cocode-heading',
  }
  const labels = { ACTIVO: 'Activo', ANULADO: 'Anulado' }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}
    >
      {labels[estado] ?? estado}
    </span>
  )
}

function MiniStat({ label, valor, accent }) {
  const accents = {
    mint: 'border-cocode-mint/40 bg-cocode-mint/15',
    coral: 'border-cocode-coral/40 bg-cocode-coral/15',
    sky: 'border-cocode-sky/40 bg-cocode-sky/20',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 ${accents[accent]}`}>
      <p className="text-xs text-cocode-text/70">{label}</p>
      <p className="font-semibold text-cocode-heading">{valor}</p>
    </div>
  )
}

function DetalleLinea({ label, valor, bold }) {
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
