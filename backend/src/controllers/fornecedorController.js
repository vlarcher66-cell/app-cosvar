const { makeController } = require('./makeController');
module.exports = makeController(require('../services/fornecedorService'));
