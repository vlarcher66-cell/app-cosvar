const router = require('express').Router();
const ctrl = require('../controllers/despesaController');

router.get('/',           ctrl.getAll);
router.post('/batch',     ctrl.createBatch);
router.patch('/:id/baixa',    ctrl.baixar);
router.get('/:id/parcelas',   ctrl.getParcelas);
router.get('/:id',        ctrl.getOne);
router.post('/',          ctrl.create);
router.put('/:id',        ctrl.update);
router.delete('/:id',     ctrl.remove);

module.exports = router;
