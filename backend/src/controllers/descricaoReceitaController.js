const { makeController } = require('./makeController');
const service = require('../services/descricaoReceitaService');
const { success, error } = require('../utils/apiResponse');
const base = makeController(service);

const getByCategoria = async (req, res, next) => {
  try {
    const data = await service.findByCategoria(req.params.categoria_id, req.user.id);
    return success(res, data);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { ...base, getByCategoria };
