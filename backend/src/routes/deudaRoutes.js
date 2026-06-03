const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  generarDeudas,
  obtenerDeudasCasa,
  obtenerSiguienteDeuda
} = require("../controllers/deudaController");

router.post(
  "/generar",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  generarDeudas
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