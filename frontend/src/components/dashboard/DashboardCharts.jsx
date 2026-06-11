import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { formatEntero } from '../../lib/deudaUtils'

const COLOR_PAGADO = '#1a7a52'
const COLOR_PENDIENTE = '#e07a5f'

export function GraficaCoberturaCobro({ coberturaPorMes, totalCasas }) {
  if (!coberturaPorMes?.length) {
    return (
      <EstadoVacio mensaje="No hay datos de cobertura para el periodo seleccionado." />
    )
  }

  if (coberturaPorMes.length === 1) {
    return (
      <GraficaCoberturaUnMes
        datos={coberturaPorMes[0].servicios}
        etiqueta={coberturaPorMes[0].etiqueta}
        totalCasas={totalCasas}
      />
    )
  }

  return (
    <GraficaCoberturaMultiplesMeses
      coberturaPorMes={coberturaPorMes}
      totalCasas={totalCasas}
    />
  )
}

function GraficaCoberturaUnMes({ datos, etiqueta, totalCasas }) {
  if (!datos?.length) {
    return (
      <EstadoVacio mensaje={`No hay deudas generadas para ${etiqueta}.`} />
    )
  }

  return (
    <div>
      <p className="mb-4 text-center text-xs text-cocode-text/60">
        Base: {formatEntero(totalCasas)} casas activas · {etiqueta} · Si no hay
        deuda registrada se cuenta como pagado
      </p>
      <LeyendaCobertura />
      <GridDonutsCobertura datos={datos} totalCasas={totalCasas} />
    </div>
  )
}

function GraficaCoberturaMultiplesMeses({ coberturaPorMes, totalCasas }) {
  return (
    <div className="space-y-8">
      <p className="text-center text-xs text-cocode-text/60">
        Base: {formatEntero(totalCasas)} casas activas · Si no hay deuda
        registrada se cuenta como pagado
      </p>
      <LeyendaCobertura />
      {coberturaPorMes.map((mes) => (
        <div key={mes.etiqueta}>
          <h4 className="mb-3 text-center text-sm font-medium text-cocode-heading">
            {mes.etiqueta}
          </h4>
          {mes.servicios?.length ? (
            <GridDonutsCobertura datos={mes.servicios} totalCasas={totalCasas} />
          ) : (
            <EstadoVacio mensaje={`Sin deudas generadas para ${mes.etiqueta}.`} />
          )}
        </div>
      ))}
    </div>
  )
}

function LeyendaCobertura() {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-4 text-xs text-cocode-text/80">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: COLOR_PAGADO }}
        />
        Pagado
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: COLOR_PENDIENTE }}
        />
        Aún debe
      </span>
    </div>
  )
}

function GridDonutsCobertura({ datos, totalCasas }) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-6">
      {datos.map((item) => (
        <DonutCoberturaServicio
          key={item.servicio}
          item={item}
          totalCasas={totalCasas}
        />
      ))}
    </div>
  )
}

function DonutCoberturaServicio({ item, totalCasas }) {
  let pieData = [
    {
      name: 'Pagado',
      value: item.casasPagadas,
      color: COLOR_PAGADO,
      porcentaje: item.porcentajePagado,
    },
    {
      name: 'Aún debe',
      value: item.casasPendientes,
      color: COLOR_PENDIENTE,
      porcentaje: item.porcentajePendiente,
    },
  ].filter((slice) => slice.value > 0)

  if (!pieData.length) {
    pieData = [
      {
        name: 'Pagado',
        value: 1,
        color: COLOR_PAGADO,
        porcentaje: 100,
      },
    ]
  }

  return (
    <div className="flex w-52 flex-col items-center rounded-xl border border-cocode-mint/30 bg-cocode-cream/20 px-3 py-4">
      <div className="mb-1 flex h-12 w-full items-center justify-center">
        <p className="line-clamp-2 text-center text-sm font-medium leading-tight text-cocode-heading">
          {item.servicio}
        </p>
      </div>
      <div className="h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={pieData.length > 1 ? 2 : 0}
            >
              {pieData.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<TooltipDonut totalCasas={totalCasas} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex h-10 w-full items-center justify-center">
        <p className="text-center text-xs leading-tight text-cocode-text/70">
          <span className="text-cocode-mint-deep">{item.porcentajePagado}% pagado</span>
          {' · '}
          <span className="text-cocode-coral-deep">
            {item.porcentajePendiente}% debe
          </span>
        </p>
      </div>
    </div>
  )
}

function TooltipDonut({ active, payload, totalCasas }) {
  if (!active || !payload?.length) return null

  const slice = payload[0]
  const porcentaje = slice.payload.porcentaje

  return (
    <div className="rounded-lg border border-cocode-mint/40 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-cocode-heading">{slice.name}</p>
      <p className="text-cocode-text/80">
        {formatEntero(slice.value)} casas ({porcentaje}%)
      </p>
      <p className="text-xs text-cocode-text/60">
        De {formatEntero(totalCasas)} casas activas
      </p>
    </div>
  )
}

function EstadoVacio({ mensaje }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-cocode-mint/40 bg-cocode-cream/30 px-6 text-center text-sm text-cocode-text/60">
      {mensaje}
    </div>
  )
}
