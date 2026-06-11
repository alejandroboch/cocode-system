const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  crearCasa,
  listarCasas,
  buscarCasas,
  buscarPorUbicacion,
  listarTelefonosCasas,
  listarPlacasCasas,
  obtenerCasa,
  editarCasa,
  actualizarContactoCasa
} = require("../controllers/casaController");

router.post(
  "/",
  verifyToken,
  authorize("ADMINISTRADOR"),
  crearCasa
);

router.get(
  "/",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  listarCasas
);

router.get(
  "/buscar",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  buscarCasas
);

router.get(
  "/ubicacion",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  buscarPorUbicacion
);

router.get(
  "/telefonos",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  listarTelefonosCasas
);

router.get(
  "/placas",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  listarPlacasCasas
);

router.get(
  "/:id",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  obtenerCasa
);

router.put(
  "/:id",
  verifyToken,
  authorize("ADMINISTRADOR"),
  editarCasa
);

router.put(
  "/:id/contacto",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  actualizarContactoCasa
);

module.exports = router;