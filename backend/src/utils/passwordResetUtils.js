const crypto = require("crypto");

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_HOURS = 1;

function normalizarEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generarTokenRestablecimiento() {
  const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expira = new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000);

  return { token, hash, expira };
}

function hashTokenRestablecimiento(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  RESET_TOKEN_HOURS,
  normalizarEmail,
  esEmailValido,
  generarTokenRestablecimiento,
  hashTokenRestablecimiento
};
