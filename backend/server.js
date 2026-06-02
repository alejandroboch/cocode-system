require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/auth", require("./src/routes/authRoutes"));

app.use("/api/test", require("./src/routes/testRoutes"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});