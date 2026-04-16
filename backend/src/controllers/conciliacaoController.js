const service = require('../services/conciliacaoService');
const { success, error } = require('../utils/apiResponse');

const getMovimentos = async (req, res, next) => {
  try {
    const { conta_id, mes, ano } = req.query;
    const data = await service.getMovimentos(req.user.id, conta_id, mes, ano);
    return success(res, data);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const setConciliado = async (req, res, next) => {
  try {
    const { tipo, id } = req.params;
    const { conciliado } = req.body;
    await service.setConciliado(req.user.id, tipo, id, conciliado);
    return success(res, null, 'Conciliação atualizada');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { getMovimentos, setConciliado };
