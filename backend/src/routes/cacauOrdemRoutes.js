const router = require('express').Router();
const ctrl = require('../controllers/cacauOrdemController');

router.get('/resumo',              ctrl.resumo);
router.get('/saldo/:comprador_id', ctrl.saldoDisponivel);
router.get('/',                    ctrl.index);
router.get('/:id',    ctrl.show);
router.post('/',      ctrl.store);
router.put('/:id',    ctrl.update);
router.delete('/:id', ctrl.destroy);

module.exports = router;
