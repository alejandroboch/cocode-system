const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const uploadExcel = require("../middlewares/uploadExcel");

const {
  importarExcel
} = require("../controllers/importacionController");

router.post(
  "/excel",
  verifyToken,
  authorize("ADMINISTRADOR"),
  uploadExcel.single("archivo"),
  importarExcel
);

module.exports = router;