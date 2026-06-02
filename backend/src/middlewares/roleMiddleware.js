const authorize = (...rolesPermitidos) => {

    return (req, res, next) => {
  
      const rolUsuario = req.user.rol;
  
      if (!rolesPermitidos.includes(rolUsuario)) {
  
        return res.status(403).json({
          mensaje: "No tiene permisos para esta acción"
        });
  
      }
  
      next();
  
    };
  
  };
  
  module.exports = authorize;