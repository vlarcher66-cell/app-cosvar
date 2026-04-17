const repo = require('../repositories/clienteImovelRepository');

const findAll  = (usuario_id)       => repo.findAll(usuario_id);
const findById = (id, usuario_id)   => repo.findById(id, usuario_id);
const create   = (data)             => repo.create(data);
const update   = (id, data, uid)    => repo.update(id, data, uid);
const remove   = (id, usuario_id)   => repo.remove(id, usuario_id);

module.exports = { findAll, findById, create, update, remove };
