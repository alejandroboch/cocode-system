const nodemailer = require("nodemailer");

function crearTransporte() {
  const host = process.env.SMTP_HOST;
  const pass = process.env.SMTP_PASS;

  if (!host || !String(pass ?? "").trim()) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });
}

function urlRestablecimiento(token) {
  const base = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/$/, "");

  return `${base}/restablecer-contrasena?token=${encodeURIComponent(token)}`;
}

async function enviarCorreoRestablecimiento({ email, nombre, token }) {
  const enlace = urlRestablecimiento(token);
  const remitente =
    process.env.SMTP_FROM || "COCODE Villas del Quetzal <noreply@cocode.local>";

  const asunto = "Restablecer contraseña — COCODE Villas del Quetzal";
  const texto = [
    `Hola ${nombre},`,
    "",
    "Recibimos una solicitud para restablecer tu contraseña del sistema COCODE.",
    "Si fuiste tú, abre este enlace (válido por 1 hora):",
    "",
    enlace,
    "",
    "Si no solicitaste el cambio, ignora este correo.",
    "",
    "COCODE Villas del Quetzal"
  ].join("\n");

  const html = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña del sistema COCODE.</p>
    <p>Si fuiste tú, haz clic en el siguiente enlace (válido por 1 hora):</p>
    <p><a href="${enlace}">${enlace}</a></p>
    <p>Si no solicitaste el cambio, ignora este correo.</p>
    <p>COCODE Villas del Quetzal</p>
  `;

  const transporte = crearTransporte();

  if (!transporte) {
    console.log("[EMAIL] SMTP no configurado. Enlace de restablecimiento:");
    console.log(enlace);
    return {
      simulado: true,
      enlace
    };
  }

  try {
    await transporte.sendMail({
      from: remitente,
      to: email,
      subject: asunto,
      text: texto,
      html
    });

    console.log(`[EMAIL] Correo de restablecimiento enviado a ${email}`);

    return { simulado: false };
  } catch (error) {
    console.error("[EMAIL] Error al enviar correo:", error.message);
    throw new Error(
      "No se pudo enviar el correo. Revise la configuración SMTP del servidor."
    );
  }
}

function smtpConfigurado() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PASS);
}

module.exports = {
  enviarCorreoRestablecimiento,
  urlRestablecimiento,
  smtpConfigurado
};
