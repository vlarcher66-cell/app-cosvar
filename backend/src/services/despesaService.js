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

const baixar = async (id, data) => {
  const despesa = await findById(id, data.usuario_id);
  if (despesa.status === 'pago') throw { statusCode: 400, message: 'Despesa já foi baixada' };
  if (!data.data_pagamento) throw { statusCode: 400, message: 'Data de pagamento é obrigatória' };

  // Normaliza parcelas — aceita array novo ou formato legado
  const parcelas = Array.isArray(data.parcelas) && data.parcelas.length > 0
    ? data.parcelas
    : [{ conta_id: data.conta_id, forma_pagamento_id: data.forma_pagamento_id || null,
         valor: data.valor_pago, acrescimo: data.acrescimo || 0, desconto: data.desconto_pagamento || 0 }];

  if (!parcelas.every(p => p.conta_id)) throw { statusCode: 400, message: 'Todas as parcelas precisam de uma conta' };
  if (!parcelas.every(p => Number(p.valor) > 0)) throw { statusCode: 400, message: 'Todas as parcelas precisam ter valor maior que zero' };

  await repo.baixar(id, { parcelas, data_pagamento: data.data_pagamento, observacao: data.observacao, usuario_id: data.usuario_id });
};

const getParcelas = (despesa_id) => repo.getParcelas(despesa_id);

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

module.exports = { findAll, findById, create, createBatch, update, remove, baixar, getParcelas };
