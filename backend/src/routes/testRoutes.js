const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");

router.get(
  "/private",
  verifyToken,
  (req, res) => {

    res.json({
      mensaje: "Ruta protegida",
      usuario: req.user
    });

  }
);

module.exports = router;