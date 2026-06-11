const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { registrarBitacora } = require("../utils/bitacoraUtils");
const {
  normalizarEmail,
  esEmailValido
} = require("../utils/passwordResetUtils");

const camposUsuario = {
  id: true,
  nombre: true,
  usuario: true,
  email: true,
  activo: true,
  ultimoLogin: true,
  createdAt: true,
  rolId: true,
  rol: true
};

const listarRoles = async (req, res) => {

  try {

    const roles = await prisma.rol.findMany({
      orderBy: {
        nombre: "asc"
      }
    });

    return res.json(roles);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al listar roles"
    });

  }

};

const listarUsuarios = async (req, res) => {

  try {

    const usuarios = await prisma.usuario.findMany({
      select: camposUsuario,
      orderBy: {
        nombre: "asc"
      }
    });

    return res.json(usuarios);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al listar usuarios"
    });

  }

};

const crearUsuario = async (req, res) => {

  try {

    const {
      nombre,
      usuario,
      email,
      password,
      rolId
    } = req.body;

    const emailNorm = normalizarEmail(email);

    if (!esEmailValido(emailNorm)) {
      return res.status(400).json({
        mensaje: "Indique un correo electrónico válido"
      });
    }

    const existe = await prisma.usuario.findUnique({
      where: {
        usuario
      }
    });

    if (existe) {

      return res.status(400).json({
        mensaje: "El usuario ya existe"
      });

    }

    const emailExiste = await prisma.usuario.findUnique({
      where: {
        email: emailNorm
      }
    });

    if (emailExiste) {
      return res.status(400).json({
        mensaje: "El correo electrónico ya está registrado"
      });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
        data: {
          nombre,
          usuario,
          email: emailNorm,
          password: hash,
          rolId
        },
        select: camposUsuario
      });

    await registrarBitacora(prisma, {
      usuarioId: req.user.id,
      modulo: "USUARIOS",
      accion: "CREAR",
      descripcion: `Usuario creado: ${nuevoUsuario.usuario} (${nuevoUsuario.nombre})`
    });

    return res.status(201).json(nuevoUsuario);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensaje: "Error al crear usuario"
    });

  }

};

const obtenerUsuario = async (req, res) => {

    try {
  
      const { id } = req.params;
  
      const usuario = await prisma.usuario.findUnique({
        where: {
          id: Number(id)
        },
        select: camposUsuario
      });
  
      if (!usuario) {
        return res.status(404).json({
          mensaje: "Usuario no encontrado"
        });
      }
  
      return res.json(usuario);
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al obtener usuario"
      });
  
    }
  
  };

  const editarUsuario = async (req, res) => {

    try {
  
      const { id } = req.params;
  
      const {
        nombre,
        usuario,
        email,
        rolId
      } = req.body;
  
      const usuarioExistente = await prisma.usuario.findUnique({
        where: {
          id: Number(id)
        }
      });
  
      if (!usuarioExistente) {
        return res.status(404).json({
          mensaje: "Usuario no encontrado"
        });
      }

      const emailNorm = normalizarEmail(email);

      if (!esEmailValido(emailNorm)) {
        return res.status(400).json({
          mensaje: "Indique un correo electrónico válido"
        });
      }

      const emailDuplicado = await prisma.usuario.findFirst({
        where: {
          email: emailNorm,
          NOT: {
            id: Number(id)
          }
        }
      });

      if (emailDuplicado) {
        return res.status(400).json({
          mensaje: "El correo electrónico ya está registrado"
        });
      }
  
      const data = {
        nombre,
        usuario,
        email: emailNorm,
        rolId
      };
  
      const usuarioActualizado = await prisma.usuario.update({
        where: {
          id: Number(id)
        },
        data,
        select: camposUsuario
      });

      await registrarBitacora(prisma, {
        usuarioId: req.user.id,
        modulo: "USUARIOS",
        accion: "EDITAR",
        descripcion: `Usuario actualizado: ${usuarioActualizado.usuario}`
      });
  
      return res.json(usuarioActualizado);
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        mensaje: "Error al actualizar usuario"
      });
  
    }
  
  };

module.exports = {
  listarRoles,
  listarUsuarios,
  crearUsuario,
  obtenerUsuario,
  editarUsuario
};
