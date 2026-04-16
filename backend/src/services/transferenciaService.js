const repo = require('../repositories/transferenciaRepository');

const findAll  = (usuario_id, filters) => repo.findAll(usuario_id, filters);

const findById = async (id, usuario_id) => {
  const item = await repo.findById(id, usuario_id);
  if (!item) throw { statusCode: 404, message: 'Transferência não encontrada' };
  return item;
};

const create = async (data) => {
  if (!data.conta_origem_id)  throw { statusCode: 400, message: 'Conta de origem é obrigatória' };
  if (!data.conta_destino_id) throw { statusCode: 400, message: 'Conta de destino é obrigatória' };
  if (String(data.conta_origem_id) === String(data.conta_destino_id))
    throw { statusCode: 400, message: 'Conta de origem e destino devem ser diferentes' };
  if (!data.valor || parseFloat(data.valor) <= 0) throw { statusCode: 400, message: 'Valor inválido' };
  if (!data.data) throw { statusCode: 400, message: 'Data é obrigatória' };
  return repo.create(data);
};

const update = async (id, data) => {
  await findById(id, data.usuario_id);
  if (String(data.conta_origem_id) === String(data.conta_destino_id))
    throw { statusCode: 400, message: 'Conta de origem e destino devem ser diferentes' };
  await repo.update(id, data);
};

const remove = async (id, usuario_id) => {
  await findById(id, usuario_id);
  await repo.remove(id, usuario_id);
};

module.exports = { findAll, findById, create, update, remove };
