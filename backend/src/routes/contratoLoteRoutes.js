const router = require('express').Router();
const ctrl   = require('../controllers/contratoLoteController');

router.get('/',                   ctrl.getAll);
router.get('/:id',                ctrl.getOne);
router.post('/',                  ctrl.create);
router.put('/:id',                ctrl.update);
router.patch('/:id/rescindir',    ctrl.rescindir);
router.delete('/:id',             ctrl.remove);

module.exports = router;
