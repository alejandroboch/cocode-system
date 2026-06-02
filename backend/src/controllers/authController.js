const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

    const passwordValida = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValida) {
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos"
      });
    }

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

module.exports = {
  login
};