const dashboardService = require('../services/dashboardService');
const { success, error } = require('../utils/apiResponse');

const getResumo = async (req, res, next) => {
  try {
    const now = new Date();
    const mes = parseInt(req.query.mes) || (now.getMonth() + 1);
    const ano = parseInt(req.query.ano) || now.getFullYear();
    const data = await dashboardService.getResumo(req.user.id, mes, ano);
    return success(res, data);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { getResumo };
