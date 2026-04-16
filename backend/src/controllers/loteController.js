const service = require('../services/loteService');
const { success, error } = require('../utils/apiResponse');

const getOne = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id, req.user.id);
    if (!data) return error(res, 'Lote não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const id = await service.create({ ...req.body, usuario_id: req.user.id });
    return success(res, { id }, 'Lote criado', 201);
  } catch (err) { next(err); }
};

const createBulk = async (req, res, next) => {
  try {
    const { lotes } = req.body; // [{ quadra_id, numero, area, valor }]
    const comUsuario = lotes.map(l => ({ ...l, usuario_id: req.user.id }));
    await service.createBulk(comUsuario);
    return success(res, null, `${lotes.length} lotes criados`, 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    await service.update(req.params.id, { ...req.body, usuario_id: req.user.id });
    return success(res, null, 'Lote atualizado');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.id);
    return success(res, null, 'Lote excluído');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return error(res, 'Lote possui contrato vinculado', 409);
    next(err);
  }
};

module.exports = { getOne, create, createBulk, update, remove };
