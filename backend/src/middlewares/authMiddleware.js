const { verifyToken } = require('../utils/jwtHelper');
const { error } = require('../utils/apiResponse');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Aceita token via query string (para iframe/download direto)
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.split(' ')[1]
    : req.query.token;

  if (!token) {
    return error(res, 'Token não fornecido', 401);
  }
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
