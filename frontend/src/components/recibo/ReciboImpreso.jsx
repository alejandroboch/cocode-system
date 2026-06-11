import {
  descripcionItem,
  formatCobrador,
  formatFechaRecibo,
  formatMontoRecibo,
} from '../../lib/formatRecibo'
import './recibo-print.css'

const CONTACTO = {
  email: 'Villasdelquetzalayudasocial@gmail.com',
  oficinas: 'Oficinas y secretaria Tel. 5992-4510',
  garita: 'Garita Cocode Tel. 5991-9336',
}

export default function ReciboImpreso({ datos }) {
  if (!datos) return null

  const { detallePago, casa, estado } = datos
  const lineas =
    datos.lineas?.length > 0
      ? datos.lineas
      : [
          {
            item: 1,
            codigo: datos.item?.codigo,
            descripcion: datos.item?.descripcion ?? datos.servicio,
            periodo: datos.periodo,
            total: detallePago.totalCancelado,
          },
        ]

  const totalTabla = formatMontoRecibo(detallePago.totalCancelado)
  const tablaCompacta = lineas.length > 4

  return (
    <div className="recibo-impreso-wrap">
      <article className="recibo-impreso" aria-label="Recibo de pago">
        <header className="recibo-impreso__header">
          <div className="recibo-impreso__header-izq">
            <span className="recibo-impreso__serial">{datos.numeroRecibo}</span>
          </div>
          <div className="recibo-impreso__header-centro">
            <h1 className="recibo-impreso__titulo">RECIBO DE PAGO</h1>
          </div>
          <div className="recibo-impreso__header-der">
            <img
              src="/logo-cocode.png"
              alt=""
              className="recibo-impreso__logo"
            />
            <p className="recibo-impreso__marca-nombre">
              COCODE VILLAS DEL QUETZAL
            </p>
            <p>{formatFechaRecibo(datos.fecha)}</p>
            <p>Código: {casa.codigoCasa}</p>
          </div>
        </header>

        <section className="recibo-impreso__cliente">
          <p>
            Recibimos de:{' '}
            <span className="recibo-impreso__subrayado">
              {casa.propietario || '—'}
            </span>
          </p>
          <p>
            Dirección:{' '}
            <span className="recibo-impreso__subrayado">
              {casa.direccion || '—'}
            </span>
          </p>
        </section>

        <table
          className={`recibo-impreso__tabla${tablaCompacta ? ' recibo-impreso__tabla--compacta' : ''}`}
        >
          <thead>
            <tr>
              <th>Item</th>
              <th className="col-desc">Descripción</th>
              <th>Mes</th>
              <th>Año</th>
              <th className="col-pago">Pago</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((linea) => (
              <tr
                key={`${linea.periodo?.mes}-${linea.periodo?.anio}-${linea.item}`}
              >
                <td>{linea.item}</td>
                <td className="col-desc">
                  {descripcionItem(
                    { codigo: linea.codigo, descripcion: linea.descripcion },
                    datos.servicio,
                  )}
                </td>
                <td>{linea.periodo?.mes ?? '—'}</td>
                <td>{linea.periodo?.anio ?? '—'}</td>
                <td className="col-pago">
                  {formatMontoRecibo(linea.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} />
              <td>TOTAL</td>
              <td className="col-pago">{totalTabla}</td>
            </tr>
          </tfoot>
        </table>

        <section className="recibo-impreso__resumen">
          <div className="recibo-impreso__resumen-izq">
            <FilaResumen
              label="Monto de la deuda:"
              valor={`Q${formatMontoRecibo(detallePago.montoDeuda)}`}
            />
            <FilaResumen
              label="Mora:"
              valor={`Q${formatMontoRecibo(detallePago.mora)}`}
            />
            <FilaResumen
              label="Total deuda:"
              valor={`Q${formatMontoRecibo(
                detallePago.totalDeuda ??
                  Number(detallePago.montoDeuda) + Number(detallePago.mora),
              )}`}
              bold
            />
            <FilaResumen
              label="Efectivo recibido:"
              valor={`Q${formatMontoRecibo(detallePago.efectivoRecibido)}`}
            />
            <FilaResumen
              label="Total cancelado:"
              valor={`Q${formatMontoRecibo(detallePago.totalCancelado)}`}
              bold
            />
            {Number(detallePago.cambio ?? 0) > 0 && (
              <FilaResumen
                label="Cambio:"
                valor={`Q${formatMontoRecibo(detallePago.cambio)}`}
              />
            )}
          </div>
          <div className="recibo-impreso__resumen-der">
            <div className="recibo-impreso__gracias">
              Gracias por su pago puntual. Su aporte nos ayuda a seguir
              trabajando por nuestra comunidad.
            </div>
          </div>
        </section>

        <p className="recibo-impreso__obs">
          Observaciones:{' '}
          {datos.observaciones?.trim() ? (
            <span className="recibo-impreso__obs-texto">
              {datos.observaciones.trim()}
            </span>
          ) : (
            <span className="recibo-impreso__obs-linea" />
          )}
        </p>

        <p className="recibo-impreso__cobrador">
          Cobrador {formatCobrador(datos.cobrador)}
        </p>

        <footer className="recibo-impreso__pie">
          <div className="recibo-impreso__pie-legal">
            <p>
              Este es el único comprobante de pago que reconoce COCODE VILLAS
              DEL QUETZAL
            </p>
            <p>Realizar pago correspondiente del 01 al 05 de cada mes</p>
            <p>ORIGINAL: Cliente COPIA: Contabilidad</p>
          </div>
          <div className="recibo-impreso__pie-contacto">
            <p>{CONTACTO.email}</p>
            <p>{CONTACTO.oficinas}</p>
            <p>{CONTACTO.garita}</p>
          </div>
        </footer>

        {estado === 'ANULADO' && (
          <p className="recibo-impreso__anulado">RECIBO ANULADO</p>
        )}
      </article>
    </div>
  )
}

function FilaResumen({ label, valor, bold }) {
  return (
    <div className="recibo-impreso__fila">
      <span>{label}</span>
      {bold ? <strong>{valor}</strong> : <span>{valor}</span>}
    </div>
  )
}
