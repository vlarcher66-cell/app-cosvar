const service = require('../services/clienteImovelService');
const { success, error } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    return success(res, await service.findAll(req.user.id));
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const item = await service.findById(req.params.id, req.user.id);
    if (!item) return error(res, 'Cliente não encontrado', 404);
    return success(res, item);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    if (!req.body.nome) return error(res, 'Nome é obrigatório', 400);
    const id = await service.create({ ...req.body, usuario_id: req.user.id });
    return success(res, { id }, 'Cliente criado', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    if (!req.body.nome) return error(res, 'Nome é obrigatório', 400);
    await service.update(req.params.id, req.body, req.user.id);
    return success(res, null, 'Cliente atualizado');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.id);
    return success(res, null, 'Cliente removido');
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
