const { makeRoutes } = require('./makeRoutes');
const router = makeRoutes(require('../controllers/receitaController'));
const ctrl   = require('../controllers/receitaController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/lancar-venda', authMiddleware, ctrl.lancarReceitaVenda);

module.exports = router;
