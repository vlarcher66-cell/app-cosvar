const { makeService } = require('./makeSimpleService');
const repo = require('../repositories/produtorRepository');
module.exports = makeService(repo);
