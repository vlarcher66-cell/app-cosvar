const repo = require('../repositories/itemDespesaRepository');
const { makeService } = require('./makeSimpleService');
const base = makeService(repo);

const findBySubgrupo = (subgrupo_id, usuario_id) => repo.findBySubgrupo(subgrupo_id, usuario_id);

module.exports = { ...base, findBySubgrupo };
