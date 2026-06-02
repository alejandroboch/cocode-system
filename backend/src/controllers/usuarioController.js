const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");

const listarUsuarios = async (req, res) => {

  try {

    const usuarios = await prisma.usuario.findMany({
      include: {
        rol: true
      },
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
      password,
      rolId
    } = req.body;

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

    const hash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
        data: {
          nombre,
          usuario,
          password: hash,
          rolId
        },
        select: {
          id: true,
          nombre: true,
          usuario: true,
          activo: true,
          rolId: true,
          createdAt: true
        }
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
        select: {
          id: true,
          nombre: true,
          usuario: true,
          activo: true,
          ultimoLogin: true,
          createdAt: true,
          rol: true
        }
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
        rolId,
        password
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
  
      const data = {
        nombre,
        usuario,
        rolId
      };
  
      if (password && password.trim() !== "") {
        data.password = await bcrypt.hash(password, 10);
      }
  
      const usuarioActualizado = await prisma.usuario.update({
        where: {
          id: Number(id)
        },
        data,
        select: {
          id: true,
          nombre: true,
          usuario: true,
          activo: true,
          rolId: true
        }
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
  listarUsuarios,
  crearUsuario,
  obtenerUsuario,
  editarUsuario
};