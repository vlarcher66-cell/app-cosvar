const { makeRoutes } = require('./makeRoutes');
const ctrl = require('../controllers/formaPagamentoController');
module.exports = makeRoutes(ctrl);
