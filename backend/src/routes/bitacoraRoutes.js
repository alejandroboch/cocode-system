const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  listarBitacora,
  listarOpcionesFiltro
} = require("../controllers/bitacoraController");

router.get(
  "/",
  verifyToken,
  authorize("ADMINISTRADOR"),
  listarBitacora
);

router.get(
  "/opciones",
  verifyToken,
  authorize("ADMINISTRADOR"),
  listarOpcionesFiltro
);

module.exports = router;
