const service = require('../services/contratoLoteService');
const { success, error } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const filtros = {
      status:            req.query.status,
      empreendimento_id: req.query.empreendimento_id,
      comprador_id:      req.query.comprador_id,
    };
    return success(res, await service.findAll(req.user.id, filtros));
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id, req.user.id);
    if (!data) return error(res, 'Contrato não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const id = await service.create({ ...req.body, usuario_id: req.user.id });
    return success(res, { id }, 'Contrato criado', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    await service.update(req.params.id, { ...req.body, usuario_id: req.user.id });
    return success(res, null, 'Contrato atualizado');
  } catch (err) { next(err); }
};

const rescindir = async (req, res, next) => {
  try {
    await service.rescindir(req.params.id, req.user.id);
    return success(res, null, 'Contrato rescindido');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.id);
    return success(res, null, 'Contrato excluído');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, rescindir, remove };
