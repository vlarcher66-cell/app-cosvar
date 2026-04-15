const { makeController } = require('./makeController');
const service = require('../services/formaPagamentoService');
module.exports = makeController(service);
