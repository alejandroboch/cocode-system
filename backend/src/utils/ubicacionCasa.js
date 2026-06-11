function normalizarUbicacion(valor) {
  const texto = String(valor ?? "").trim();

  if (!texto) {
    return null;
  }

  if (/^\d+$/.test(texto)) {
    return String(Number(texto));
  }

  return texto.toUpperCase();
}

function parsearDireccion(direccion) {
  const texto = String(direccion || "");
  const manzana = texto.match(/manzana\s*\.?\s*([A-Za-z0-9-]+)/i)?.[1];
  const lote = texto.match(/lote\s*\.?\s*([A-Za-z0-9-]+)/i)?.[1];

  return {
    manzana: normalizarUbicacion(manzana),
    lote: normalizarUbicacion(lote)
  };
}

function formatearUbicacion(manzana, lote) {
  if (!manzana || !lote) {
    return null;
  }

  return `Mz ${manzana} Lt ${lote}`;
}

module.exports = {
  normalizarUbicacion,
  parsearDireccion,
  formatearUbicacion
};
