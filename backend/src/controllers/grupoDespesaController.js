const { makeController } = require('./makeController');
const service = require('../services/grupoDespesaService');
module.exports = makeController(service);
