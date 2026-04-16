const repo = require('../repositories/empreendimentoRepository');

const findAll  = (usuario_id)       => repo.findAll(usuario_id);
const findById = (id, usuario_id)   => repo.findById(id, usuario_id);
const create   = (data)             => repo.create(data);
const update   = (id, data)         => repo.update(id, data);
const remove   = (id, usuario_id)   => repo.remove(id, usuario_id);

module.exports = { findAll, findById, create, update, remove };
