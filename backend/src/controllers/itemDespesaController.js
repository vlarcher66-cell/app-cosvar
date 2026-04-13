const { makeController } = require('./makeController');
const service = require('../services/itemDespesaService');
const { success, error } = require('../utils/apiResponse');
const base = makeController(service);

const getBySubgrupo = async (req, res, next) => {
  try {
    const data = await service.findBySubgrupo(req.params.subgrupo_id, req.user.id);
    return success(res, data);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { ...base, getBySubgrupo };
