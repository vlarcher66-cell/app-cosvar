const repo = require('../repositories/loteRepository');

const findByEmpreendimento = (empreendimento_id, usuario_id) =>
  repo.findByEmpreendimento(empreendimento_id, usuario_id);

const findById = (id, usuario_id) => repo.findById(id, usuario_id);
const create   = (data)           => repo.create(data);
const update   = (id, data)       => repo.update(id, data);
const updateStatus = (id, status, usuario_id) => repo.updateStatus(id, status, usuario_id);
const remove   = (id, usuario_id) => repo.remove(id, usuario_id);
const createBulk = (lotes)        => repo.createBulk(lotes);

module.exports = { findByEmpreendimento, findById, create, update, updateStatus, remove, createBulk };
