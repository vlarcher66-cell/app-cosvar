const router = require('express').Router();
const ctrl   = require('../controllers/conciliacaoController');

router.get('/',                    ctrl.getMovimentos);
router.patch('/:tipo/:id',         ctrl.setConciliado);

module.exports = router;
