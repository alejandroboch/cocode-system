const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");

const {
  obtenerRecibo,
  obtenerRecibosPorCasa,
  anularRecibo
} = require("../controllers/reciboController");

router.get(
    "/casa/:codigoCasa",
    verifyToken,
    obtenerRecibosPorCasa
  );

router.put(
   "/anular/:numeroRecibo",
   verifyToken,
   anularRecibo
 );  

router.get(
  "/:numeroRecibo",
  verifyToken,
  obtenerRecibo
);

module.exports = router;