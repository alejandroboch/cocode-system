const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  crearServicio,
  listarServicios
} = require("../controllers/servicioController");

router.post(
  "/",
  verifyToken,
  authorize("ADMINISTRADOR"),
  crearServicio
);

router.get(
  "/",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  listarServicios
);

module.exports = router;