const router = require('express').Router();
const ctrl   = require('../controllers/propostaLoteController');

router.get('/',                    ctrl.getAll);
router.get('/:id',                 ctrl.getOne);
router.get('/lote/:lote_id',       ctrl.getByLote);
router.post('/',                   ctrl.create);
router.post('/:id/aprovar',        ctrl.aprovar);
router.post('/:id/recusar',        ctrl.recusar);
router.delete('/:id',              ctrl.remove);

module.exports = router;
