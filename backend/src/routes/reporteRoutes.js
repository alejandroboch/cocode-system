const express = require("express");

const router = express.Router();

const verifyToken =
  require("../middlewares/authMiddleware");

const {
  estadoCuenta,
  deudasPendientes,
  recaudacionMensual,
  saldosFavor,
  pagosPorFecha
} = require("../controllers/reporteController");

router.get(
  "/estado-cuenta/:codigoCasa",
  verifyToken,
  estadoCuenta
);

router.get(
    "/deudas-pendientes",
    verifyToken,
    deudasPendientes
  );

  router.get(
    "/recaudacion",
    verifyToken,
    recaudacionMensual
  );

  router.get(
    "/saldos-favor",
    verifyToken,
    saldosFavor
  );

  router.get(
    "/pagos",
    verifyToken,
    pagosPorFecha
  );

module.exports = router;