const service = require('../services/despesaService');
const { success, created, error } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const data = await service.findAll(req.user.id, req.query);
    return success(res, data);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id, req.user.id);
    return success(res, data);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const id = await service.create({ ...req.body, usuario_id: req.user.id });
    const item = await service.findById(id, req.user.id);
    return created(res, item);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    await service.update(req.params.id, { ...req.body, usuario_id: req.user.id });
    const item = await service.findById(req.params.id, req.user.id);
    return success(res, item, 'Despesa atualizada');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.id);
    return success(res, null, 'Despesa excluída');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const createBatch = async (req, res, next) => {
  try {
    const ids = await service.createBatch({ ...req.body, usuario_id: req.user.id });
    return created(res, { ids, count: ids.length }, `${ids.length} despesa(s) lançada(s)`);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { getAll, getOne, create, createBatch, update, remove };
