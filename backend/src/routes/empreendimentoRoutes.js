const router = require('express').Router();
const ctrl   = require('../controllers/empreendimentoController');

router.get('/',                         ctrl.getAll);
router.get('/:id',                      ctrl.getOne);
router.get('/:id/lotes',                ctrl.getLotes);
router.post('/',                        ctrl.create);
router.put('/:id',                      ctrl.update);
router.delete('/:id',                   ctrl.remove);

// Gestão de quadras
router.get('/:id/quadras',              ctrl.getQuadras);
router.post('/:id/quadras',             ctrl.createQuadra);
router.delete('/:id/quadras/:quadra_id', ctrl.removeQuadra);

// Geração de lotes em lote para uma quadra
router.post('/:id/quadras/:quadra_id/gerar-lotes', ctrl.gerarLotes);

module.exports = router;
