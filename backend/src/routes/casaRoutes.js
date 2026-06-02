const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  crearCasa,
  listarCasas,
  buscarCasas,
  obtenerCasa,
  editarCasa
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

module.exports = router;