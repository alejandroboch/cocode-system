const estadoCasaStyles = {
  ACTIVA: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20',
  VACIA: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300/50',
  ABANDONADA: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  ALQUILADA: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
}

const estadoCasaLabels = {
  ACTIVA: 'Activa',
  VACIA: 'Vacía',
  ABANDONADA: 'Abandonada',
  ALQUILADA: 'Alquilada',
}

export function EstadoCasaBadge({ estado }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${estadoCasaStyles[estado] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {estadoCasaLabels[estado] ?? estado}
    </span>
  )
}

export function ActivoBadge({ activo }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
        activo
          ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20'
          : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
      }`}
    >
      {activo ? 'Activa' : 'Inactiva'}
    </span>
  )
}
