const router = require('express').Router();
const ctrl = require('../controllers/subgrupoDespesaController');

router.get('/',                       ctrl.getAll);
router.get('/por-grupo/:grupo_id',    ctrl.getByGrupo);
router.get('/:id',                    ctrl.getOne);
router.post('/',                      ctrl.create);
router.put('/:id',                    ctrl.update);
router.delete('/:id',                 ctrl.remove);

module.exports = router;
