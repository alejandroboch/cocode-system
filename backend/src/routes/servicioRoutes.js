const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  crearServicio,
  listarServicios,
  editarServicio,
  eliminarServicio
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

router.put(
  "/:id",
  verifyToken,
  authorize("ADMINISTRADOR"),
  editarServicio
);

router.delete(
  "/:id",
  verifyToken,
  authorize("ADMINISTRADOR"),
  eliminarServicio
);

module.exports = router;