const authService = require('../services/authService');
const { success, error } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const result = await authService.login(email, senha);
    return success(res, result, 'Login realizado com sucesso');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const usuario = await authService.me(req.user.id);
    return success(res, usuario);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { login, me };
