import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Alert from '../ui/Alert'
import ReciboImpreso from './ReciboImpreso'
import { obtenerRecibo } from '../../services/reciboService'

export default function ReciboImpresionModal({
  open,
  numeroRecibo,
  token,
  datosIniciales = null,
  onClose,
}) {
  const [datos, setDatos] = useState(datosIniciales)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setDatos(null)
      setError('')
      document.body.classList.remove('imprimiendo-recibo')
      return
    }

    if (datosIniciales?.numeroRecibo === numeroRecibo) {
      setDatos(datosIniciales)
      return
    }

    if (!numeroRecibo || !token) return

    let cancelado = false
    setCargando(true)
    setError('')

    obtenerRecibo(token, numeroRecibo)
      .then((data) => {
        if (!cancelado) setDatos(data)
      })
      .catch((err) => {
        if (!cancelado) {
          setDatos(null)
          setError(err.message ?? 'No se pudo cargar el recibo')
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [open, numeroRecibo, token, datosIniciales])

  const esAnulado = datos?.estado === 'ANULADO'

  const imprimir = useCallback(() => {
    document.body.classList.add('imprimiendo-recibo')
    window.print()
    const quitar = () => {
      document.body.classList.remove('imprimiendo-recibo')
    }
    window.addEventListener('afterprint', quitar, { once: true })
  }, [])

  const portal =
    datos &&
    createPortal(
      <div id="recibo-impreso-root">
        <ReciboImpreso datos={datos} />
      </div>,
      document.body,
    )

  return (
    <>
      {portal}
      <Modal
        open={open}
        title={esAnulado ? 'Imprimir recibo anulado' : 'Imprimir recibo'}
        onClose={onClose}
        size="xl"
      >
        {cargando && (
          <p className="text-sm text-cocode-text/70">Cargando recibo…</p>
        )}
        {error && (
          <p className="text-sm text-cocode-coral">{error}</p>
        )}
        {datos && !cargando && (
          <>
            {esAnulado && (
              <Alert type="warning" className="mb-4">
                Este recibo está anulado. Se imprimirá con la leyenda{' '}
                <strong>RECIBO ANULADO</strong>.
              </Alert>
            )}
            <p className="mb-3 text-xs text-cocode-text/65">
              Formato <strong>mitad superior de hoja carta</strong> (8.5″ ×
              5.5″). Al imprimir: papel <strong>Carta / Letter</strong>,
              orientación <strong>Vertical</strong>, escala{' '}
              <strong>100%</strong>, sin «ajustar a página», márgenes en cero.
            </p>
            <ReciboImpreso datos={datos} />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={imprimir}>
                Imprimir
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
