const { makeService } = require('./makeSimpleService');
const repo = require('../repositories/bancoRepository');
module.exports = makeService(repo);
