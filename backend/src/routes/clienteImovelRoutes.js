const router = require('express').Router();
const ctrl   = require('../controllers/clienteImovelController');
const auth   = require('../middleware/authMiddleware');

router.use(auth);
router.get('/',     ctrl.getAll);
router.get('/:id',  ctrl.getOne);
router.post('/',    ctrl.create);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
