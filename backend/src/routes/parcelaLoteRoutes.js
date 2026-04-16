const router = require('express').Router();
const ctrl   = require('../controllers/parcelaLoteController');

router.get('/vencidas',                   ctrl.getVencidas);
router.get('/por-mes',                    ctrl.getByMes);
router.get('/contrato/:contrato_id',      ctrl.getByContrato);
router.patch('/:id/baixar',              ctrl.baixar);
router.patch('/:id/estornar',            ctrl.estornar);

module.exports = router;
