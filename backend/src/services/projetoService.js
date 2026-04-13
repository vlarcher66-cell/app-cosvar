const { makeService } = require('./makeSimpleService');
const repo = require('../repositories/projetoRepository');
module.exports = makeService(repo);
