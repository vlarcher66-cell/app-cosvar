const router = require('express').Router();
const { authMiddleware } = require('../middlewares/authMiddleware');

// Públicas
router.use('/auth', require('./authRoutes'));

// Protegidas
router.use('/usuarios',    authMiddleware, require('./usuarioRoutes'));
router.use('/dashboard',   authMiddleware, require('./dashboardRoutes'));

// Despesas
router.use('/grupos-despesa',    authMiddleware, require('./grupoDespesaRoutes'));
router.use('/subgrupos-despesa', authMiddleware, require('./subgrupoDespesaRoutes'));
router.use('/itens-despesa',     authMiddleware, require('./itemDespesaRoutes'));
router.use('/despesas',          authMiddleware, require('./despesaRoutes'));

// Receitas
router.use('/categorias-receita', authMiddleware, require('./categoriaReceitaRoutes'));
router.use('/descricoes-receita', authMiddleware, require('./descricaoReceitaRoutes'));
router.use('/receitas',           authMiddleware, require('./receitaRoutes'));

// Cadastros
router.use('/produtores',    authMiddleware, require('./produtorRoutes'));
router.use('/fornecedores',  authMiddleware, require('./fornecedorRoutes'));
router.use('/compradores',   authMiddleware, require('./compradorRoutes'));
router.use('/projetos',      authMiddleware, require('./projetoRoutes'));
router.use('/centros-custo', authMiddleware, require('./centroCustoRoutes'));
router.use('/bancos',        authMiddleware, require('./bancoRoutes'));
router.use('/contas',        authMiddleware, require('./contaRoutes'));

// Forma de pagamento
router.use('/formas-pagamento', authMiddleware, require('./formaPagamentoRoutes'));

// Cacau
router.use('/producao-cacau', authMiddleware, require('./producaoCacauRoutes'));
router.use('/cacau-ordem',    authMiddleware, require('./cacauOrdemRoutes'));
router.use('/cacau-baixa',    authMiddleware, require('./cacauBaixaRoutes'));

// Conciliação
router.use('/conciliacao',   authMiddleware, require('./conciliacaoRoutes'));

// Transferências
router.use('/transferencias', authMiddleware, require('./transferenciaRoutes'));

// Imóveis / Loteamento
router.use('/empreendimentos',  authMiddleware, require('./empreendimentoRoutes'));
router.use('/lotes',            authMiddleware, require('./loteRoutes'));
router.use('/contratos-lote',   authMiddleware, require('./contratoLoteRoutes'));
router.use('/parcelas-lote',    authMiddleware, require('./parcelaLoteRoutes'));
router.use('/clientes-imovel',  authMiddleware, require('./clienteImovelRoutes'));
router.use('/contratos-lote/:contrato_id/documentos', require('./documentoContratoRoutes'));

module.exports = router;
