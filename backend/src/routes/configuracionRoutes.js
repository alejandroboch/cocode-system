const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  obtenerConfiguracion
} = require("../controllers/configuracionController");

router.get(
  "/",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  obtenerConfiguracion
);

module.exports = router;
