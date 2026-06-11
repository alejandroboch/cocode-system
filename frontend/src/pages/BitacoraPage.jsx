import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listarBitacora, opcionesFiltroBitacora } from '../services/bitacoraService'
import { listarUsuarios } from '../services/usuarioService'
import {
  ACCION_STYLES,
  formatFechaBitacora,
  haceDiasIso,
  hoyIso,
  labelAccion,
  labelModulo,
} from '../lib/bitacoraUtils'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName, selectClassName } from '../components/ui/FormField'

const PAGE_SIZE = 30

export default function BitacoraPage() {
  const { token } = useAuth()

  const [registros, setRegistros] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [modulos, setModulos] = useState([])
  const [acciones, setAcciones] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [filtroDesde, setFiltroDesde] = useState(haceDiasIso(30))
  const [filtroHasta, setFiltroHasta] = useState(hoyIso())

  useEffect(() => {
    Promise.all([
      listarUsuarios(token),
      opcionesFiltroBitacora(token),
    ])
      .then(([usuariosData, opciones]) => {
        setUsuarios(usuariosData)
        setModulos(opciones.modulos ?? [])
        setAcciones(opciones.acciones ?? [])
      })
      .catch((err) => {
        setError(err.message ?? 'No se pudieron cargar los filtros')
      })
  }, [token])

  const cargarBitacora = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listarBitacora(token, {
        usuarioId: filtroUsuario || undefined,
        modulo: filtroModulo || undefined,
        accion: filtroAccion || undefined,
        desde: filtroDesde || undefined,
        hasta: filtroHasta || undefined,
        page,
        limit: PAGE_SIZE,
      })
      setRegistros(data.data ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch (err) {
      setError(err.message ?? 'No se pudo cargar la bitácora')
      setRegistros([])
    } finally {
      setLoading(false)
    }
  }, [
    token,
    filtroUsuario,
    filtroModulo,
    filtroAccion,
    filtroDesde,
    filtroHasta,
    page,
  ])

  useEffect(() => {
    cargarBitacora()
  }, [cargarBitacora])

  function aplicarFiltros(event) {
    event.preventDefault()
    setPage(1)
  }

  function limpiarFiltros() {
    setFiltroUsuario('')
    setFiltroModulo('')
    setFiltroAccion('')
    setFiltroDesde(haceDiasIso(30))
    setFiltroHasta(hoyIso())
    setPage(1)
  }

  return (
    <>
      <PageHeader
        title="Bitácora"
        description="Historial de acciones: quién creó, editó o eliminó registros y a qué hora"
      />

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form
        onSubmit={aplicarFiltros}
        className="mb-6 rounded-2xl border border-cocode-mint/40 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <FormField label="Usuario" id="filtroUsuario">
            <select
              id="filtroUsuario"
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className={selectClassName}
            >
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.usuario})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Módulo" id="filtroModulo">
            <select
              id="filtroModulo"
              value={filtroModulo}
              onChange={(e) => setFiltroModulo(e.target.value)}
              className={selectClassName}
            >
              <option value="">Todos</option>
              {modulos.map((modulo) => (
                <option key={modulo} value={modulo}>
                  {labelModulo(modulo)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Acción" id="filtroAccion">
            <select
              id="filtroAccion"
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className={selectClassName}
            >
              <option value="">Todas</option>
              {acciones.map((accion) => (
                <option key={accion} value={accion}>
                  {labelAccion(accion)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Desde" id="filtroDesde">
            <input
              id="filtroDesde"
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              className={inputClassName}
            />
          </FormField>

          <FormField label="Hasta" id="filtroHasta">
            <input
              id="filtroHasta"
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              className={inputClassName}
            />
          </FormField>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit">Buscar</Button>
          <Button type="button" variant="secondary" onClick={limpiarFiltros}>
            Limpiar
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-cocode-mint/40 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cocode-mint/30 px-5 py-4">
          <p className="text-sm text-cocode-text/70">
            {loading
              ? 'Cargando…'
              : `${total} registro(s) encontrado(s)`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-cocode-text/70">
                Página {page} de {totalPages}
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-cocode-text/60">
            Cargando bitácora…
          </div>
        ) : registros.length === 0 ? (
          <div className="p-12 text-center text-sm text-cocode-text/60">
            No hay registros con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-cocode-mint/30 bg-cocode-cream/50 text-xs uppercase tracking-wide text-cocode-text/60">
                  <th className="px-4 py-3 font-semibold">Fecha y hora</th>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Módulo</th>
                  <th className="px-4 py-3 font-semibold">Acción</th>
                  <th className="px-4 py-3 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cocode-mint/20">
                {registros.map((item) => (
                  <tr key={item.id} className="hover:bg-cocode-mint/5">
                    <td className="whitespace-nowrap px-4 py-3 text-cocode-heading">
                      {formatFechaBitacora(item.fecha)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-cocode-heading">
                        {item.usuario?.nombre ?? '—'}
                      </p>
                      <p className="text-xs text-cocode-text/60">
                        {item.usuario?.usuario ?? ''}
                        {item.usuario?.rol?.nombre
                          ? ` · ${item.usuario.rol.nombre}`
                          : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-cocode-text/80">
                      {labelModulo(item.modulo)}
                    </td>
                    <td className="px-4 py-3">
                      <AccionBadge accion={item.accion} />
                    </td>
                    <td className="max-w-md px-4 py-3 text-cocode-text/80">
                      {item.descripcion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function AccionBadge({ accion }) {
  const style =
    ACCION_STYLES[accion] ?? 'bg-slate-100 text-slate-700 ring-slate-300/50'

  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${style}`}
    >
      {labelAccion(accion)}
    </span>
  )
}
