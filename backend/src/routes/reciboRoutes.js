const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  listarRecibos,
  obtenerRecibo,
  obtenerRecibosPorCasa,
  anularRecibo
} = require("../controllers/reciboController");

router.get(
  "/",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  listarRecibos
);

router.get(
    "/casa/:codigoCasa",
    verifyToken,
    authorize("ADMINISTRADOR", "SECRETARIA"),
    obtenerRecibosPorCasa
  );

router.put(
   "/anular/:numeroRecibo",
   verifyToken,
   authorize("ADMINISTRADOR", "SECRETARIA"),
   anularRecibo
 );  

router.get(
  "/:numeroRecibo",
  verifyToken,
  authorize("ADMINISTRADOR", "SECRETARIA"),
  obtenerRecibo
);

module.exports = router;