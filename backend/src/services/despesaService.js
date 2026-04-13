const repo = require('../repositories/despesaRepository');

const findAll = (usuario_id, filters) => repo.findAll(usuario_id, filters);

const findById = async (id, usuario_id) => {
  const item = await repo.findById(id, usuario_id);
  if (!item) throw { statusCode: 404, message: 'Despesa não encontrada' };
  return item;
};

const create = (data) => repo.create(data);

const update = async (id, data) => {
  await findById(id, data.usuario_id);
  await repo.update(id, data);
};

const remove = async (id, usuario_id) => {
  await findById(id, usuario_id);
  await repo.remove(id, usuario_id);
};

const createBatch = async (payload) => {
  const { itens, compartilhado, usuario_id } = payload;
  if (!itens || itens.length === 0) throw { statusCode: 400, message: 'Informe pelo menos um item' };
  const registros = itens.map(it => ({
    ...compartilhado,
    item_id: it.item_id,
    subgrupo_id: it.subgrupo_id,
    grupo_id: it.grupo_id,
    valor: it.valor,
    descricao: it.descricao || compartilhado.descricao || null,
    usuario_id,
  }));
  return repo.createBatch(registros);
};

module.exports = { findAll, findById, create, createBatch, update, remove };
