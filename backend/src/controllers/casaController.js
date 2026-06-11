const prisma = require("../config/prisma");
const { registrarBitacora } = require("../utils/bitacoraUtils");
const {
  normalizarUbicacion,
  parsearDireccion
} = require("../utils/ubicacionCasa");

function resolverUbicacionCasa({ manzana, lote, direccion }) {
  let manzanaNorm = normalizarUbicacion(manzana);
  let loteNorm = normalizarUbicacion(lote);

  if (!manzanaNorm || !loteNorm) {
    const parseada = parsearDireccion(direccion);

    manzanaNorm = manzanaNorm || parseada.manzana;
    loteNorm = loteNorm || parseada.lote;
  }

  return {
    manzana: manzanaNorm,
    lote: loteNorm
  };
}

async function ubicacionDuplicada(prismaClient, manzana, lote, casaIdExcluir = null) {
  if (!manzana || !lote) {
    return null;
  }

  return prismaClient.casa.findFirst({
    where: {
      manzana,
      lote,
      ...(casaIdExcluir
        ? {
            NOT: {
              id: casaIdExcluir
            }
          }
        : {})
    }
  });
}

const includeCasaListado = {
  sector: true,
  _count: {
    select: {
      telefonos: true,
      placas: true
    }
  }
};

const includeCasaDetalle = {
  sector: true,
  telefonos: {
    orderBy: {
      id: "asc"
    }
  },
  placas: {
    orderBy: [
      { tipo: "asc" },
      { id: "asc" }
    ]
  }
};

function normalizarTelefonos(telefonos) {
  if (!Array.isArray(telefonos)) {
    return [];
  }

  const vistos = new Set();

  return telefonos
    .map((item) => String(item ?? "").trim())
    .filter((numero) => {
      if (!numero || vistos.has(numero)) {
        return false;
      }

      vistos.add(numero);
      return true;
    });
}

function normalizarPlacas(placas) {
  if (!Array.isArray(placas)) {
    return [];
  }

  const resultado = [];

  for (const item of placas) {
    const placa = String(item?.placa ?? "").trim().toUpperCase();
    const tipo = item?.tipo;

    if (!placa) {
      continue;
    }

    if (tipo !== "AUTO" && tipo !== "MOTO") {
      throw new Error("Cada placa debe indicar tipo AUTO o MOTO");
    }

    resultado.push({ placa, tipo });
  }

  return resultado;
}

const crearCasa = async (req, res) => {
  try {

    const {
      codigoCasa,
      manzana,
      lote,
      direccion,
      propietarioActual,
      observaciones,
      estado,
      sectorId
    } = req.body;

    const ubicacion = resolverUbicacionCasa({
      manzana,
      lote,
      direccion
    });

    if (!ubicacion.manzana || !ubicacion.lote) {
      return res.status(400).json({
        mensaje: "Debe indicar manzana y lote"
      });
    }

    const duplicadaUbicacion = await ubicacionDuplicada(
      prisma,
      ubicacion.manzana,
      ubicacion.lote
    );

    if (duplicadaUbicacion) {
      return res.status(400).json({
        mensaje: "Ya existe una casa con esa manzana y lote"
      });
    }

    const existe = await prisma.casa.findUnique({
      where: {
        codigoCasa: Number(codigoCasa)
      }
    });

    if (existe) {
      return res.status(400).json({
        mensaje: "Ya existe una casa con ese código"
      });
    }

    const nuevaCasa = await prisma.casa.create({
      data: {
        codigoCasa: Number(codigoCasa),
        manzana: ubicacion.manzana,
        lote: ubicacion.lote,
        direccion,
        propietarioActual,
        observaciones,
        estado,
        sectorId: sectorId ? Number(sectorId) : null
      },
      include: includeCasaListado
    });

    await registrarBitacora(prisma, {
      usuarioId: req.user.id,
      modulo: "CASAS",
      accion: "CREAR",
      descripcion: `Casa #${nuevaCasa.codigoCasa} creada — ${direccion ?? ""}`
    });

    return res.status(201).json(nuevaCasa);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al crear casa"
    });

  }

};

const listarCasas = async (req, res) => {

    try {
  
      const casas = await prisma.casa.findMany({
        include: includeCasaListado,
        orderBy: {
          codigoCasa: "asc"
        }
      });
  
      return res.json(casas);
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al listar casas"
      });
  
    }
  
  };

  const buscarCasas = async (req, res) => {

    try {
  
      const { q } = req.query;
  
      if (!q) {
        return res.status(400).json({
          mensaje: "Debe proporcionar un criterio de búsqueda"
        });
      }
  
      const casas = await prisma.casa.findMany({
        where: {
          OR: [
            {
              direccion: {
                contains: q,
                mode: "insensitive"
              }
            },
            {
              propietarioActual: {
                contains: q,
                mode: "insensitive"
              }
            },
            {
              telefonos: {
                some: {
                  numero: {
                    contains: q,
                    mode: "insensitive"
                  }
                }
              }
            },
            {
              placas: {
                some: {
                  placa: {
                    contains: q,
                    mode: "insensitive"
                  }
                }
              }
            },
            !isNaN(q)
              ? {
                  codigoCasa: Number(q)
                }
              : {}
          ]
        },
        include: includeCasaListado,
        orderBy: {
          codigoCasa: "asc"
        }
      });

      return res.json(casas);

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        mensaje: "Error al buscar casas"
      });

    }

  };

  const buscarPorUbicacion = async (req, res) => {

    try {

      const manzana = normalizarUbicacion(req.query.manzana);
      const lote = normalizarUbicacion(req.query.lote);

      if (!manzana || !lote) {
        return res.status(400).json({
          mensaje: "Debe indicar manzana y lote"
        });
      }

      const casa = await prisma.casa.findFirst({
        where: {
          manzana,
          lote
        },
        include: includeCasaListado
      });

      if (!casa) {
        return res.status(404).json({
          mensaje: "No se encontró casa con esa manzana y lote"
        });
      }

      return res.json(casa);

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        mensaje: "Error al buscar casa por ubicación"
      });

    }

  };

  const obtenerCasa = async (req, res) => {

    try {

      const { id } = req.params;

      const casa = await prisma.casa.findUnique({
        where: {
          id: Number(id)
        },
        include: includeCasaDetalle
      });
  
      if (!casa) {
        return res.status(404).json({
          mensaje: "Casa no encontrada"
        });
      }
  
      return res.json(casa);
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al obtener casa"
      });
  
    }
  
  };

  const editarCasa = async (req, res) => {

    try {
  
      const { id } = req.params;
  
      const {
        codigoCasa,
        manzana,
        lote,
        direccion,
        propietarioActual,
        observaciones,
        estado,
        activo,
        sectorId
      } = req.body;
  
      const casaExistente = await prisma.casa.findUnique({
        where: {
          id: Number(id)
        }
      });
  
      if (!casaExistente) {
        return res.status(404).json({
          mensaje: "Casa no encontrada"
        });
      }

      const ubicacion = resolverUbicacionCasa({
        manzana: manzana ?? casaExistente.manzana,
        lote: lote ?? casaExistente.lote,
        direccion: direccion ?? casaExistente.direccion
      });

      if (!ubicacion.manzana || !ubicacion.lote) {
        return res.status(400).json({
          mensaje: "Debe indicar manzana y lote"
        });
      }

      const duplicadaUbicacion = await ubicacionDuplicada(
        prisma,
        ubicacion.manzana,
        ubicacion.lote,
        casaExistente.id
      );

      if (duplicadaUbicacion) {
        return res.status(400).json({
          mensaje: "Ya existe otra casa con esa manzana y lote"
        });
      }
  
      if (
        codigoCasa &&
        codigoCasa !== casaExistente.codigoCasa
      ) {
  
        const codigoDuplicado = await prisma.casa.findUnique({
          where: {
            codigoCasa: Number(codigoCasa)
          }
        });
  
        if (codigoDuplicado) {
          return res.status(400).json({
            mensaje: "Ya existe una casa con ese código"
          });
        }
  
      }
  
      const casaActualizada = await prisma.casa.update({
        where: {
          id: Number(id)
        },
        data: {
          codigoCasa: codigoCasa
            ? Number(codigoCasa)
            : casaExistente.codigoCasa,

          manzana: ubicacion.manzana,
          lote: ubicacion.lote,
          direccion,
          propietarioActual,
          observaciones,
          estado,
          activo,

          sectorId: sectorId
            ? Number(sectorId)
            : null
        },
        include: includeCasaListado
      });

      await registrarBitacora(prisma, {
        usuarioId: req.user.id,
        modulo: "CASAS",
        accion: "EDITAR",
        descripcion: `Casa #${casaActualizada.codigoCasa} actualizada`
      });

      return res.json(casaActualizada);

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        mensaje: "Error al actualizar casa"
      });

    }

  };

  const actualizarContactoCasa = async (req, res) => {

    try {

      const { id } = req.params;
      const { telefonos, placas } = req.body;

      const casaExistente = await prisma.casa.findUnique({
        where: {
          id: Number(id)
        }
      });

      if (!casaExistente) {
        return res.status(404).json({
          mensaje: "Casa no encontrada"
        });
      }

      let telefonosLimpios;
      let placasLimpias;

      try {
        telefonosLimpios = normalizarTelefonos(telefonos);
        placasLimpias = normalizarPlacas(placas);
      } catch (validationError) {
        return res.status(400).json({
          mensaje: validationError.message
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.telefonoCasa.deleteMany({
          where: {
            casaId: Number(id)
          }
        });

        await tx.placaCasa.deleteMany({
          where: {
            casaId: Number(id)
          }
        });

        if (telefonosLimpios.length) {
          await tx.telefonoCasa.createMany({
            data: telefonosLimpios.map((numero) => ({
              casaId: Number(id),
              numero
            }))
          });
        }

        if (placasLimpias.length) {
          await tx.placaCasa.createMany({
            data: placasLimpias.map((item) => ({
              casaId: Number(id),
              placa: item.placa,
              tipo: item.tipo
            }))
          });
        }
      });

      const casaActualizada = await prisma.casa.findUnique({
        where: {
          id: Number(id)
        },
        include: includeCasaDetalle
      });

      await registrarBitacora(prisma, {
        usuarioId: req.user.id,
        modulo: "CASAS",
        accion: "EDITAR",
        descripcion:
          `Contacto casa #${casaActualizada.codigoCasa}: ${telefonosLimpios.length} tel., ${placasLimpias.length} placas`
      });

      return res.json(casaActualizada);

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        mensaje: "Error al actualizar teléfonos y placas"
      });

    }

  };

  const listarTelefonosCasas = async (req, res) => {

    try {

      const { q } = req.query;

      const telefonos = await prisma.telefonoCasa.findMany({
        where: q
          ? {
              OR: [
                {
                  numero: {
                    contains: String(q),
                    mode: "insensitive"
                  }
                },
                {
                  casa: {
                    direccion: {
                      contains: String(q),
                      mode: "insensitive"
                    }
                  }
                },
                {
                  casa: {
                    propietarioActual: {
                      contains: String(q),
                      mode: "insensitive"
                    }
                  }
                },
                !isNaN(q)
                  ? {
                      casa: {
                        codigoCasa: Number(q)
                      }
                    }
                  : {}
              ]
            }
          : undefined,
        include: {
          casa: {
            select: {
              id: true,
              codigoCasa: true,
              direccion: true,
              propietarioActual: true,
              activo: true
            }
          }
        },
        orderBy: [
          { casa: { codigoCasa: "asc" } },
          { id: "asc" }
        ]
      });

      return res.json(
        telefonos.map((item) => ({
          id: item.id,
          numero: item.numero,
          casaId: item.casaId,
          codigoCasa: item.casa.codigoCasa,
          direccion: item.casa.direccion,
          propietarioActual: item.casa.propietarioActual,
          activo: item.casa.activo
        }))
      );

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        mensaje: "Error al listar teléfonos"
      });

    }

  };

  const listarPlacasCasas = async (req, res) => {

    try {

      const { q, tipo } = req.query;

      const where = {};

      if (tipo === "AUTO" || tipo === "MOTO") {
        where.tipo = tipo;
      }

      if (q) {
        where.OR = [
          {
            placa: {
              contains: String(q),
              mode: "insensitive"
            }
          },
          {
            casa: {
              direccion: {
                contains: String(q),
                mode: "insensitive"
              }
            }
          },
          {
            casa: {
              propietarioActual: {
                contains: String(q),
                mode: "insensitive"
              }
            }
          },
          !isNaN(q)
            ? {
                casa: {
                  codigoCasa: Number(q)
                }
              }
            : {}
        ];
      }

      const placas = await prisma.placaCasa.findMany({
        where,
        include: {
          casa: {
            select: {
              id: true,
              codigoCasa: true,
              direccion: true,
              propietarioActual: true,
              activo: true
            }
          }
        },
        orderBy: [
          { casa: { codigoCasa: "asc" } },
          { tipo: "asc" },
          { id: "asc" }
        ]
      });

      return res.json(
        placas.map((item) => ({
          id: item.id,
          placa: item.placa,
          tipo: item.tipo,
          casaId: item.casaId,
          codigoCasa: item.casa.codigoCasa,
          direccion: item.casa.direccion,
          propietarioActual: item.casa.propietarioActual,
          activo: item.casa.activo
        }))
      );

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        mensaje: "Error al listar placas"
      });

    }

  };

module.exports = {
  crearCasa,
  listarCasas,
  buscarCasas,
  buscarPorUbicacion,
  obtenerCasa,
  editarCasa,
  actualizarContactoCasa,
  listarTelefonosCasas,
  listarPlacasCasas
};