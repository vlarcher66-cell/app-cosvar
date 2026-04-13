const { makeService } = require('./makeSimpleService');
const repo = require('../repositories/centroCustoRepository');
module.exports = makeService(repo);
