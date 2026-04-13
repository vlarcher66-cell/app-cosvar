const service = require('../services/usuarioService');
const { success, created, error } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    return success(res, await service.findAll());
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    return success(res, await service.findById(req.params.id));
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const id = await service.create(req.body);
    const item = await service.findById(id);
    return created(res, item);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    await service.update(req.params.id, req.body);
    return success(res, await service.findById(req.params.id), 'Usuário atualizado');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    return success(res, null, 'Usuário excluído');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const updateSenha = async (req, res, next) => {
  try {
    const { senha_atual, nova_senha } = req.body;
    await service.updateSenha(req.user.id, senha_atual, nova_senha);
    return success(res, null, 'Senha alterada com sucesso');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, remove, updateSenha };
