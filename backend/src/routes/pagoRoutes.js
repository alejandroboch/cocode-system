const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  registrarPago
} = require("../controllers/pagoController");

router.post(
  "/",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  registrarPago
);

module.exports = router;