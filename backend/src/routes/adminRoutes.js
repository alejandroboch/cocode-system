const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.get(
  "/dashboard",
  verifyToken,
  authorize("ADMINISTRADOR"),
  (req, res) => {

    res.json({
      mensaje: "Bienvenido administrador"
    });

  }
);

module.exports = router;