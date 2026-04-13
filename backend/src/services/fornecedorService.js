const { makeService } = require('./makeSimpleService');
const repo = require('../repositories/fornecedorRepository');
module.exports = makeService(repo);
