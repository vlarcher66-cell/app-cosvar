const router = require('express').Router();
const ctrl   = require('../controllers/loteController');

router.get('/:id',     ctrl.getOne);
router.post('/bulk',   ctrl.createBulk);
router.post('/',       ctrl.create);
router.put('/:id',     ctrl.update);
router.delete('/:id',  ctrl.remove);

module.exports = router;
