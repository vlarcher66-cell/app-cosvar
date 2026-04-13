const { makeService } = require('./makeSimpleService');
const repo = require('../repositories/compradorRepository');
module.exports = makeService(repo);
