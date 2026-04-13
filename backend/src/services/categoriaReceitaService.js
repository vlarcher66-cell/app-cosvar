const { makeService } = require('./makeSimpleService');
const repo = require('../repositories/categoriaReceitaRepository');
module.exports = makeService(repo);
