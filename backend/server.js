require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/auth", require("./src/routes/authRoutes"));

app.use("/api/test", require("./src/routes/testRoutes"));

app.use("/api/admin", require("./src/routes/adminRoutes"));

app.use("/api/usuarios", require("./src/routes/usuarioRoutes"));

// para casas

app.use("/api/casas", require("./src/routes/casaRoutes.js"));

// para servicios

app.use("/api/servicios", require("./src/routes/servicioRoutes.js"));

// para tarifas especiales

app.use("/api/tarifas-especiales", require("./src/routes/tarifaEspecialRoutes.js"));

// para deudas

app.use("/api/deudas", require("./src/routes/deudaRoutes.js"));

// para pagos

app.use("/api/pagos", require("./src/routes/pagoRoutes.js"));

// para recibos

app.use("/api/recibos", require("./src/routes/reciboRoutes.js"));

// para reportes

app.use("/api/reportes", require("./src/routes/reporteRoutes.js"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});