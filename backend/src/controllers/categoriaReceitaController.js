const { makeController } = require('./makeController');
const service = require('../services/categoriaReceitaService');
module.exports = makeController(service);
