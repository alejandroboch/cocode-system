const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const {
  listarUsuarios,
  crearUsuario,
  obtenerUsuario,
  editarUsuario
} = require("../controllers/usuarioController");

router.get(
  "/",
  verifyToken,
  authorize("ADMINISTRADOR"),
  listarUsuarios
);

router.post(
  "/",
  verifyToken,
  authorize("ADMINISTRADOR"),
  crearUsuario
);

router.get(
    "/:id",
    verifyToken,
    authorize("ADMINISTRADOR"),
    obtenerUsuario
  );

  router.put(
    "/:id",
    verifyToken,
    authorize("ADMINISTRADOR"),
    editarUsuario
  );

module.exports = router;