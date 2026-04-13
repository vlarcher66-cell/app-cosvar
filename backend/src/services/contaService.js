const { makeService } = require('./makeSimpleService');
const repo = require('../repositories/contaRepository');
module.exports = makeService(repo);
