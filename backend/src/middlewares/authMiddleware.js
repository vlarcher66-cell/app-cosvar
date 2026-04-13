const { verifyToken } = require('../utils/jwtHelper');
const { error } = require('../utils/apiResponse');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Token não fornecido', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, nome, email, perfil }
    next();
  } catch (err) {
    return error(res, 'Token inválido ou expirado', 401);
  }
};

// Somente admin
const adminOnly = (req, res, next) => {
  if (req.user?.perfil !== 'admin') {
    return error(res, 'Acesso negado. Requer perfil admin.', 403);
  }
  next();
};

module.exports = { authMiddleware, adminOnly };
