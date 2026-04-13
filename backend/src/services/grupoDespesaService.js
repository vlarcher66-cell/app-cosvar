const { makeService } = require('./makeSimpleService');
const repo = require('../repositories/grupoDespesaRepository');
module.exports = makeService(repo);
