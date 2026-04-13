const repo = require('../repositories/descricaoReceitaRepository');
const { makeService } = require('./makeSimpleService');
const base = makeService(repo);

const findByCategoria = (categoria_id, usuario_id) => repo.findByCategoria(categoria_id, usuario_id);

module.exports = { ...base, findByCategoria };
