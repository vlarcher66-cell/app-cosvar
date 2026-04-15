const { makeService } = require('./makeSimpleService');
const repo = require('../repositories/formaPagamentoRepository');
module.exports = makeService(repo);
