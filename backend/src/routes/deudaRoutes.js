const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  generarDeudas,
  resumenPeriodo,
  eliminarGeneracionMes,
  obtenerDeudasCasa,
  obtenerSiguienteDeuda,
  crearCobroExtra,
  listarCobrosExtra,
  eliminarCobroExtra
} = require("../controllers/deudaController");

router.post(
  "/generar",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  generarDeudas
);

router.get(
  "/resumen-periodo",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  resumenPeriodo
);

router.post(
  "/eliminar-generacion",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  eliminarGeneracionMes
);

router.post(
  "/cobro-extra",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  crearCobroExtra
);

router.get(
  "/cobros-extra",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  listarCobrosExtra
);

router.delete(
  "/cobro-extra/:id",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  eliminarCobroExtra
);

router.get(
    "/casa/:casaId",
    verifyToken,
    authorize("ADMINISTRADOR", "SECRETARIA"),
    obtenerDeudasCasa
  );

  router.get(
    "/siguiente/:casaId/:servicioId",
    verifyToken,
    authorize("ADMINISTRADOR", "SECRETARIA"),
    obtenerSiguienteDeuda
  );

module.exports = router;
