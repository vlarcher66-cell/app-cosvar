const repo = require('../repositories/subgrupoDespesaRepository');
const { makeService } = require('./makeSimpleService');
const base = makeService(repo);

const findByGrupo = (grupo_id, usuario_id) => repo.findByGrupo(grupo_id, usuario_id);

module.exports = { ...base, findByGrupo };
