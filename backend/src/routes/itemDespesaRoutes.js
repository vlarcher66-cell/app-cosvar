const router = require('express').Router();
const ctrl = require('../controllers/itemDespesaController');

router.get('/',                              ctrl.getAll);
router.get('/por-subgrupo/:subgrupo_id',     ctrl.getBySubgrupo);
router.get('/:id',                           ctrl.getOne);
router.post('/',                             ctrl.create);
router.put('/:id',                           ctrl.update);
router.delete('/:id',                        ctrl.remove);

module.exports = router;
