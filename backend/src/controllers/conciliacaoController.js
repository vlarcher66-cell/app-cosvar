const service = require('../services/conciliacaoService');
const { success, error } = require('../utils/apiResponse');

const getMovimentos = async (req, res, next) => {
  try {
    const { conta_id, mes, ano } = req.query;
    console.log('[conciliacao] params:', { conta_id, mes, ano, usuario_id: req.user.id });
    const data = await service.getMovimentos(req.user.id, conta_id, mes, ano);
    console.log('[conciliacao] resultado:', JSON.stringify(data));
    return success(res, data);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const setConciliado = async (req, res, next) => {
  try {
    const { tipo, id } = req.params;
    const { conciliado, receita_id } = req.body;
    await service.setConciliado(req.user.id, tipo, id, conciliado, receita_id);
    return success(res, null, 'Conciliação atualizada');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { getMovimentos, setConciliado };
