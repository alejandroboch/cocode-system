const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registrarBitacora } = require("../utils/bitacoraUtils");
const {
  normalizarEmail,
  esEmailValido,
  generarTokenRestablecimiento,
  hashTokenRestablecimiento
} = require("../utils/passwordResetUtils");
const { enviarCorreoRestablecimiento } = require("../utils/emailService");

const MENSAJE_SOLICITUD_RESTABLECIMIENTO =
  "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.";

const login = async (req, res) => {

  try {

    const { usuario, password } = req.body;

    const user = await prisma.usuario.findUnique({
      where: {
        usuario
      },
      include: {
        rol: true
      }
    });

    if (!user) {
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos"
      });
    }

    if (!user.activo) {
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos"
      });
    }

    const passwordValida = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValida) {
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos"
      });
    }

    await prisma.usuario.update({
        where: {
          id: user.id
        },
        data: {
          ultimoLogin: new Date()
        }
    });

    await registrarBitacora(prisma, {
      usuarioId: user.id,
      modulo: "AUTH",
      accion: "LOGIN",
      descripcion: `Inicio de sesión: ${user.usuario}`
    });

    const token = jwt.sign(
      {
        id: user.id,
        rol: user.rol.nombre
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h"
      }
    );

    return res.json({
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        email: user.email,
        rol: user.rol.nombre
      }
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error interno"
    });

  }

};

const logout = async (req, res) => {

  try {

    const user = await prisma.usuario.findUnique({
      where: {
        id: req.user.id
      }
    });

    if (user) {
      await registrarBitacora(prisma, {
        usuarioId: user.id,
        modulo: "AUTH",
        accion: "LOGOUT",
        descripcion: `Cierre de sesión: ${user.usuario}`
      });
    }

    return res.json({
      mensaje: "Sesión cerrada correctamente"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al cerrar sesión"
    });

  }

};

const obtenerPerfil = async (req, res) => {

  try {

    const user = await prisma.usuario.findUnique({
      where: {
        id: req.user.id
      },
      include: {
        rol: true
      }
    });

    if (!user) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado"
      });
    }

    return res.json({
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      email: user.email,
      rol: user.rol.nombre
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al obtener perfil"
    });

  }

};

const solicitarRestablecimiento = async (req, res) => {

  try {

    const email = normalizarEmail(req.body.email);

    if (!esEmailValido(email)) {
      return res.status(400).json({
        mensaje: "Indique un correo electrónico válido"
      });
    }

    const user = await prisma.usuario.findUnique({
      where: {
        email
      }
    });

    if (user && user.activo) {
      const { token, hash, expira } = generarTokenRestablecimiento();

      await prisma.usuario.update({
        where: {
          id: user.id
        },
        data: {
          resetTokenHash: hash,
          resetTokenExpires: expira
        }
      });

      const resultadoCorreo = await enviarCorreoRestablecimiento({
        email: user.email,
        nombre: user.nombre,
        token
      });

      await registrarBitacora(prisma, {
        usuarioId: user.id,
        modulo: "AUTH",
        accion: "SOLICITAR_RESET",
        descripcion: `Solicitud de restablecimiento de contraseña: ${user.usuario}`
      });

      if (resultadoCorreo.simulado) {
        return res.json({
          mensaje: MENSAJE_SOLICITUD_RESTABLECIMIENTO,
          correoSimulado: true,
          aviso:
            "El enlace se enviaría a tu correo registrado, pero el servidor aún no puede enviar correos: falta SMTP_PASS en backend/.env (contraseña de aplicación del Gmail del COCODE). El correo de cada usuario es solo el destinatario; la cuenta que envía es una sola (Villasdelquetzalayudasocial@gmail.com).",
          enlaceDesarrollo: resultadoCorreo.enlace
        });
      }

      return res.json({
        mensaje: `Se envió un enlace a ${user.email}. Revise bandeja de entrada y spam.`,
        correoSimulado: false,
        destinatario: user.email
      });
    }

    return res.json({
      mensaje: MENSAJE_SOLICITUD_RESTABLECIMIENTO,
      correoSimulado: false
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "No se pudo procesar la solicitud"
    });

  }

};

const validarTokenRestablecimiento = async (req, res) => {

  try {

    const { token } = req.params;

    if (!token || token.length < 20) {
      return res.status(400).json({
        valido: false,
        mensaje: "Enlace no válido"
      });
    }

    const hash = hashTokenRestablecimiento(token);

    const user = await prisma.usuario.findFirst({
      where: {
        resetTokenHash: hash,
        resetTokenExpires: {
          gt: new Date()
        }
      },
      select: {
        email: true
      }
    });

    if (!user) {
      return res.status(400).json({
        valido: false,
        mensaje: "El enlace expiró o no es válido"
      });
    }

    return res.json({
      valido: true,
      email: user.email
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      valido: false,
      mensaje: "Error al validar el enlace"
    });

  }

};

const restablecerContrasena = async (req, res) => {

  try {

    const { token, password } = req.body;

    if (!token || token.length < 20) {
      return res.status(400).json({
        mensaje: "Enlace no válido"
      });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    const hash = hashTokenRestablecimiento(token);

    const user = await prisma.usuario.findFirst({
      where: {
        resetTokenHash: hash,
        resetTokenExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        mensaje: "El enlace expiró o no es válido"
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    await prisma.usuario.update({
      where: {
        id: user.id
      },
      data: {
        password: passwordHash,
        resetTokenHash: null,
        resetTokenExpires: null
      }
    });

    await registrarBitacora(prisma, {
      usuarioId: user.id,
      modulo: "AUTH",
      accion: "RESTABLECER_PASSWORD",
      descripcion: `Contraseña restablecida: ${user.usuario}`
    });

    return res.json({
      mensaje: "Contraseña actualizada correctamente"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "No se pudo restablecer la contraseña"
    });

  }

};

module.exports = {
  login,
  logout,
  obtenerPerfil,
  solicitarRestablecimiento,
  validarTokenRestablecimiento,
  restablecerContrasena
};
