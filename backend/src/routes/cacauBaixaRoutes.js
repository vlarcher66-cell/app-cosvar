const router = require('express').Router();
const ctrl   = require('../controllers/cacauBaixaController');

router.get('/saldo',            ctrl.saldo);
router.get('/saldo/:comprador_id', ctrl.saldoCredora);
router.get('/resumo',           ctrl.resumo);
router.get('/saldo-financeiro', ctrl.saldoFinanceiro);
router.get('/vendas-por-mes',   ctrl.vendasPorMes);
router.get('/anos',             ctrl.anosDisponiveis);
router.get('/',       ctrl.index);
router.post('/venda-completa', ctrl.vendaCompleta);
router.post('/',               ctrl.store);
router.put('/:id',    ctrl.update);
router.delete('/:id', ctrl.destroy);

module.exports = router;
