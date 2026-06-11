async function registrarBitacora(client, { usuarioId, modulo, accion, descripcion }) {
  if (!usuarioId) return;

  await client.bitacora.create({
    data: {
      usuarioId,
      modulo,
      accion,
      descripcion
    }
  });
}

module.exports = {
  registrarBitacora
};
