const express = require("express");

const router = express.Router();

const verifyToken =
  require("../middlewares/authMiddleware");

const {
  estadoCuenta,
  deudasPendientes,
  recaudacionMensual,
  pagosPorFecha,
  recibosAnulados,
  dashboard
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
    "/pagos",
    verifyToken,
    pagosPorFecha
  );

  router.get(
    "/recibos-anulados",
    verifyToken,
    recibosAnulados
  );

  router.get(
    "/dashboard",
    verifyToken,
    dashboard
  );

module.exports = router;