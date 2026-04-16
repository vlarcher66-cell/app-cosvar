const service     = require('../services/empreendimentoService');
const loteService = require('../services/loteService');
const { success, error } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try { return success(res, await service.findAll(req.user.id)); }
  catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id, req.user.id);
    if (!data) return error(res, 'Empreendimento não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

const getLotes = async (req, res, next) => {
  try {
    const emp = await service.findById(req.params.id);
    if (!emp) return error(res, 'Empreendimento não encontrado', 404);
    const lotes = await loteService.findByEmpreendimento(req.params.id, req.user.id);
    return success(res, lotes);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const id = await service.create({ ...req.body, usuario_id: req.user.id });
    return success(res, { id }, 'Empreendimento criado', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    await service.update(req.params.id, { ...req.body, usuario_id: req.user.id });
    return success(res, null, 'Empreendimento atualizado');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.id);
    return success(res, null, 'Empreendimento excluído');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return error(res, 'Empreendimento em uso', 409);
    next(err);
  }
};

module.exports = { getAll, getOne, getLotes, create, update, remove };
