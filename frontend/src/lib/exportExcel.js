import * as XLSX from 'xlsx'
import { formatFechaReporte } from './reporteUtils'

function descargarLibro(workbook, nombreArchivo) {
  XLSX.writeFile(workbook, nombreArchivo)
}

function nombreArchivo(base, sufijo = '') {
  const fecha = new Date().toISOString().slice(0, 10)
  const extra = sufijo ? `_${sufijo}` : ''
  return `${base}${extra}_${fecha}.xlsx`
}

function hojaDesdeFilas(filas, nombreHoja) {
  const hoja = XLSX.utils.aoa_to_sheet(filas)
  return { hoja, nombre: nombreHoja.slice(0, 31) }
}

export function exportarRecaudacionExcel({
  rango,
  recaudacion,
  anulados,
  netoRecaudado,
}) {
  if (!recaudacion) return

  const workbook = XLSX.utils.book_new()

  const resumen = hojaDesdeFilas(
    [
      ['Reporte de recaudación — COCODE'],
      ['Periodo', `${rango.inicio} al ${rango.fin}`],
      ['Etiqueta', rango.etiqueta],
      [],
      ['Concepto', 'Valor'],
      ['Total recaudado (Q)', recaudacion.totalRecaudado],
      ['Cantidad de pagos', recaudacion.cantidadPagos],
      ['Recibos anulados', anulados?.cantidad ?? 0],
      ['Monto anulado (Q)', anulados?.totalAnulado ?? 0],
      ['Recaudación neta (Q)', netoRecaudado],
    ],
    'Resumen',
  )
  XLSX.utils.book_append_sheet(workbook, resumen.hoja, resumen.nombre)

  if (recaudacion.porServicio?.length) {
    const porServicio = hojaDesdeFilas(
      [
        ['Servicio', 'Cantidad pagos', 'Total (Q)'],
        ...recaudacion.porServicio.map((item) => [
          item.servicio,
          item.cantidad,
          item.total,
        ]),
      ],
      'Por servicio',
    )
    XLSX.utils.book_append_sheet(workbook, porServicio.hoja, porServicio.nombre)
  }

  const detalle = hojaDesdeFilas(
    [
      [
        'Fecha',
        'Recibo',
        'Código casa',
        'Propietario',
        'Servicio',
        'Periodo deuda',
        'Monto (Q)',
        'Cobró',
      ],
      ...recaudacion.pagos.map((pago) => [
        formatFechaReporte(pago.fecha),
        pago.numeroRecibo,
        pago.codigoCasa,
        pago.propietario ?? '',
        pago.servicio,
        pago.periodo,
        pago.monto,
        pago.usuario,
      ]),
    ],
    'Detalle cobros',
  )
  XLSX.utils.book_append_sheet(workbook, detalle.hoja, detalle.nombre)

  if (anulados?.recibos?.length) {
    const hojaAnulados = hojaDesdeFilas(
      [
        [
          'Fecha anulación',
          'Recibo',
          'Código casa',
          'Propietario',
          'Servicio',
          'Periodo',
          'Monto (Q)',
          'Motivo',
          'Cobró original',
        ],
        ...anulados.recibos.map((recibo) => [
          formatFechaReporte(recibo.fechaAnulacion),
          recibo.numeroRecibo,
          recibo.codigoCasa,
          recibo.propietario ?? '',
          recibo.servicio,
          recibo.periodo,
          recibo.monto,
          recibo.motivoAnulacion ?? '',
          recibo.usuarioCobro ?? '',
        ]),
      ],
      'Anulados',
    )
    XLSX.utils.book_append_sheet(workbook, hojaAnulados.hoja, hojaAnulados.nombre)
  }

  descargarLibro(
    workbook,
    nombreArchivo('recaudacion', `${rango.inicio}_${rango.fin}`),
  )
}

export function exportarDeudasPendientesExcel(pendientes, totalPendientes) {
  const workbook = XLSX.utils.book_new()

  const hoja = hojaDesdeFilas(
    [
      ['Reporte de deudas pendientes — COCODE'],
      ['Total casas', pendientes.length],
      ['Total pendiente (Q)', totalPendientes],
      [],
      ['Código casa', 'Propietario', 'Dirección', 'Cantidad deudas', 'Total pendiente (Q)'],
      ...pendientes.map((casa) => [
        casa.codigoCasa,
        casa.propietario ?? '',
        casa.direccion ?? '',
        casa.cantidadDeudas,
        casa.totalPendiente,
      ]),
    ],
    'Deudas pendientes',
  )

  XLSX.utils.book_append_sheet(workbook, hoja.hoja, hoja.nombre)
  descargarLibro(workbook, nombreArchivo('deudas_pendientes'))
}
