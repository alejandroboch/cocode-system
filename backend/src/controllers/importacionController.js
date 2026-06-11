const prisma = require("../config/prisma");
const XLSX = require("xlsx");
const fs = require("fs");

const { parsearDireccion } = require("../utils/ubicacionCasa");

const obtenerSectorDesdeDireccion = (direccion) => {
  const match = String(direccion || "").match(/Manzana\s+([A-Za-z0-9-]+)/i);
  return match ? match[1].trim().toUpperCase() : null;
};

const obtenerServicio = (texto) => {
  const valor = String(texto || "").toUpperCase();

  if (valor.includes("AGUA")) {
    return "AGUA";
  }

  if (valor.includes("SEGURIDAD")) {
    return "SEGURIDAD Y MANTENIMIENTO";
  }

  return null;
};

const importarExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        mensaje: "Debe subir un archivo Excel"
      });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      range: 2
    });

    let ultimoCodigoCasa = null;

    let casasCreadas = 0;
    let casasActualizadas = 0;
    let deudasCreadas = 0;
    let filasIgnoradas = 0;

    const errores = [];

    for (const row of rows) {
      try {
        const idExcel = row["Id"];
        const nombre = row["Nombre"];
        const direccion = row["Direccion"];
        const servicioTexto = row["Servicio"];
        const mesTexto = row["Mes"];
        const saldoRaw = row["Saldo"];

        if (idExcel !== "" && idExcel !== null && !isNaN(Number(idExcel))) {
          ultimoCodigoCasa = Number(idExcel);
        }

        const codigoCasa = ultimoCodigoCasa;

        const nombreServicio = obtenerServicio(servicioTexto);

        if (!codigoCasa || !nombreServicio || !direccion || !mesTexto) {
          filasIgnoradas++;
          continue;
        }

        if (
          String(nombre).trim() === "16" ||
          String(direccion).trim() === "16" ||
          String(servicioTexto).trim() === "16"
        ) {
          filasIgnoradas++;
          continue;
        }

        const [anioTexto, mesNumeroTexto] = String(mesTexto).split("-");

        const anio = Number(anioTexto);
        const mes = Number(mesNumeroTexto);

        if (!anio || !mes) {
          filasIgnoradas++;
          continue;
        }

        const saldo = Number(saldoRaw || 0);

        if (saldo === 0) {
          filasIgnoradas++;
          continue;
        }

        const sectorNombre = obtenerSectorDesdeDireccion(direccion);
        const ubicacion = parsearDireccion(direccion);

        let sector = null;

        if (sectorNombre) {
          sector = await prisma.sector.upsert({
            where: {
              nombre: sectorNombre
            },
            update: {},
            create: {
              nombre: sectorNombre
            }
          });
        }

        const casaExistente = await prisma.casa.findUnique({
          where: {
            codigoCasa
          }
        });

        const casa = await prisma.casa.upsert({
          where: {
            codigoCasa
          },
          update: {
            direccion: String(direccion).trim(),
            manzana: ubicacion.manzana,
            lote: ubicacion.lote,
            propietarioActual: nombre
              ? String(nombre).trim()
              : null,
            sectorId: sector ? sector.id : null
          },
          create: {
            codigoCasa,
            direccion: String(direccion).trim(),
            manzana: ubicacion.manzana,
            lote: ubicacion.lote,
            propietarioActual: nombre
              ? String(nombre).trim()
              : null,
            sectorId: sector ? sector.id : null
          }
        });

        if (casaExistente) {
          casasActualizadas++;
        } else {
          casasCreadas++;
        }

        const servicio = await prisma.servicio.findUnique({
          where: {
            nombre: nombreServicio
          }
        });

        if (!servicio) {
          errores.push({
            codigoCasa,
            servicio: nombreServicio,
            error: "Servicio no existe en la base de datos"
          });
          continue;
        }

        if (saldo > 0) {
          const deudaExistente = await prisma.deuda.findUnique({
            where: {
              casaId_servicioId_anio_mes: {
                casaId: casa.id,
                servicioId: servicio.id,
                anio,
                mes
              }
            }
          });

          if (!deudaExistente) {
            await prisma.deuda.create({
              data: {
                casaId: casa.id,
                servicioId: servicio.id,
                anio,
                mes,
                monto: saldo,
                mora: 0,
                estado: "PENDIENTE"
              }
            });

            deudasCreadas++;
          }
        }

        if (saldo < 0) {
          filasIgnoradas++;
          continue;
        }

      } catch (error) {
        errores.push({
          fila: row,
          error: error.message
        });
      }
    }

    fs.unlinkSync(req.file.path);

    return res.json({
      mensaje: "Importación finalizada",
      totalFilas: rows.length,
      casasCreadas,
      casasActualizadas,
      deudasCreadas,
      filasIgnoradas,
      errores
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al importar Excel",
      error: error.message
    });
  }
};

module.exports = {
  importarExcel
};