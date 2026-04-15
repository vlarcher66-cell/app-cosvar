const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/receitaController');

// Rotas específicas ANTES das genéricas /:id
router.post('/lancar-venda',            ctrl.lancarReceitaVenda);
router.get('/processo/:cacau_baixa_id', ctrl.getProcesso);

// Rotas CRUD genéricas
router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getOne);
router.post('/',      ctrl.create);
router.put('/:id',    ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
