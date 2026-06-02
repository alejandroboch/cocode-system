const prisma = require("../config/prisma");

const crearCasa = async (req, res) => {

  try {

    const {
      codigoCasa,
      direccion,
      propietarioActual,
      observaciones,
      estado,
      sectorId
    } = req.body;

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
        direccion,
        propietarioActual,
        observaciones,
        estado,
        sectorId: sectorId ? Number(sectorId) : null
      },
      include: {
        sector: true
      }
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
        include: {
          sector: true
        },
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
            !isNaN(q)
              ? {
                  codigoCasa: Number(q)
                }
              : {}
          ]
        },
        include: {
          sector: true
        },
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

  const obtenerCasa = async (req, res) => {

    try {
  
      const { id } = req.params;
  
      const casa = await prisma.casa.findUnique({
        where: {
          id: Number(id)
        },
        include: {
          sector: true
        }
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
  
          direccion,
          propietarioActual,
          observaciones,
          estado,
          activo,
  
          sectorId: sectorId
            ? Number(sectorId)
            : null
        },
        include: {
          sector: true
        }
      });
  
      return res.json(casaActualizada);
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al actualizar casa"
      });
  
    }
  
  };

module.exports = {
  crearCasa,
  listarCasas,
  buscarCasas,
  obtenerCasa,
  editarCasa
};