const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  crearTarifaEspecial
} = require("../controllers/tarifaEspecialController");

router.post(
  "/",
  verifyToken,
  authorize("ADMINISTRADOR"),
  crearTarifaEspecial
);

module.exports = router;