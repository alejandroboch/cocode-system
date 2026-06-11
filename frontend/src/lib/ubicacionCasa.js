export function normalizarUbicacion(valor) {
  const texto = String(valor ?? '').trim()

  if (!texto) {
    return ''
  }

  if (/^\d+$/.test(texto)) {
    return String(Number(texto))
  }

  return texto.toUpperCase()
}

export function formatearUbicacion(manzana, lote) {
  if (!manzana || !lote) {
    return null
  }

  return `Mz ${manzana} Lt ${lote}`
}

export function etiquetaCasa(casa) {
  const ubicacion = formatearUbicacion(casa?.manzana, casa?.lote)

  if (ubicacion) {
    return ubicacion
  }

  if (casa?.direccion) {
    return casa.direccion
  }

  if (casa?.codigoCasa) {
    return `Casa #${casa.codigoCasa}`
  }

  return 'Casa'
}
