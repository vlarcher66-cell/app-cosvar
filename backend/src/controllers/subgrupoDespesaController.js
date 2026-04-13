const { makeController } = require('./makeController');
const service = require('../services/subgrupoDespesaService');
const { success, error } = require('../utils/apiResponse');
const base = makeController(service);

const getByGrupo = async (req, res, next) => {
  try {
    const data = await service.findByGrupo(req.params.grupo_id, req.user.id);
    return success(res, data);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { ...base, getByGrupo };
