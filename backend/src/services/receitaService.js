const repo = require('../repositories/receitaRepository');

const findAll = (usuario_id, filters) => repo.findAll(usuario_id, filters);

const findById = async (id, usuario_id) => {
  const item = await repo.findById(id, usuario_id);
  if (!item) throw { statusCode: 404, message: 'Receita não encontrada' };
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

const lancarReceitaVenda = async ({ baixa_id, valor, data, conta_id, observacao, usuario_id }) => {
  if (!valor || parseFloat(valor) <= 0) throw { statusCode: 400, message: 'Valor inválido para lançamento de receita' };
  if (!conta_id) throw { statusCode: 400, message: 'Conta de recebimento é obrigatória' };
  if (!data) throw { statusCode: 400, message: 'Data é obrigatória' };
  return repo.lancarReceitaVenda({ baixa_id, valor, data, conta_id, observacao, usuario_id });
};

module.exports = { findAll, findById, create, update, remove, lancarReceitaVenda };
