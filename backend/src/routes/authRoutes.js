const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");

const {
  login,
  logout,
  obtenerPerfil,
  solicitarRestablecimiento,
  validarTokenRestablecimiento,
  restablecerContrasena
} = require("../controllers/authController");

router.post("/login", login);

router.post("/logout", verifyToken, logout);

router.get("/perfil", verifyToken, obtenerPerfil);

router.post("/solicitar-restablecimiento", solicitarRestablecimiento);

router.get("/validar-token/:token", validarTokenRestablecimiento);

router.post("/restablecer-contrasena", restablecerContrasena);

module.exports = router;
