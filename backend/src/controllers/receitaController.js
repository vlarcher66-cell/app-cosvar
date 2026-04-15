const service = require('../services/receitaService');
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
    return success(res, item, 'Receita atualizada');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.id);
    return success(res, null, 'Receita excluída');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const lancarReceitaVenda = async (req, res, next) => {
  try {
    const id = await service.lancarReceitaVenda({ ...req.body, usuario_id: req.user.id });
    return created(res, { id }, 'Receita lançada com sucesso');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const getProcesso = async (req, res, next) => {
  try {
    const data = await service.getProcesso(req.params.cacau_baixa_id, req.user.id);
    console.log('[getProcesso] baixa:', JSON.stringify(data.baixa));
    console.log('[getProcesso] parcelas:', data.parcelas.length);
    return success(res, data);
  } catch (err) {
    console.error('[getProcesso] erro:', err);
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, remove, lancarReceitaVenda, getProcesso };
