const router = require('express').Router();
const ctrl   = require('../controllers/contaController');

router.get('/por-forma',      ctrl.findByForma);   // GET /contas/por-forma?forma_pagamento_id=X
router.get('/:id/formas',     ctrl.getFormas);
router.put('/:id/formas',     ctrl.setFormas);
router.get('/',               ctrl.getAll);
router.get('/:id',            ctrl.getOne);
router.post('/',              ctrl.create);
router.put('/:id',            ctrl.update);
router.delete('/:id',         ctrl.remove);

module.exports = router;
