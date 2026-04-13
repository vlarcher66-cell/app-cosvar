const router = require('express').Router();
const ctrl = require('../controllers/usuarioController');
const { adminOnly } = require('../middlewares/authMiddleware');

router.get('/',               adminOnly, ctrl.getAll);
router.get('/:id',            adminOnly, ctrl.getOne);
router.post('/',              adminOnly, ctrl.create);
router.put('/:id',            adminOnly, ctrl.update);
router.delete('/:id',         adminOnly, ctrl.remove);
router.put('/senha/alterar',  ctrl.updateSenha);

module.exports = router;
