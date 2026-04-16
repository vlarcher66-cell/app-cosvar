const router = require('express').Router();
const ctrl   = require('../controllers/empreendimentoController');

router.get('/',            ctrl.getAll);
router.get('/:id',         ctrl.getOne);
router.get('/:id/lotes',   ctrl.getLotes);
router.post('/',           ctrl.create);
router.put('/:id',         ctrl.update);
router.delete('/:id',      ctrl.remove);

module.exports = router;
