const repo       = require('../repositories/propostaLoteRepository');
const clienteRepo = require('../repositories/clienteImovelRepository');
const loteRepo    = require('../repositories/loteRepository');
const contratoRepo = require('../repositories/contratoLoteRepository');
const { success, error } = require('../utils/apiResponse');
const db = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    return success(res, await repo.findAll(req.user.id));
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const p = await repo.findById(req.params.id, req.user.id);
    if (!p) return error(res, 'Proposta não encontrada', 404);
    return success(res, p);
  } catch (err) { next(err); }
};

const getByLote = async (req, res, next) => {
  try {
    return success(res, await repo.findByLote(req.params.lote_id, req.user.id));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { lote_id, cliente, cliente_imovel_id, valor_total, desconto_avista_pct,
            entrada_pct, entrada_valor, parcelas_json, observacao } = req.body;

    // Se veio dados de novo cliente, cria primeiro
    let clienteId = cliente_imovel_id || null;
    if (cliente && cliente.nome) {
      clienteId = await clienteRepo.create({ ...cliente, usuario_id: req.user.id });
    }

    const id = await repo.create({
      lote_id, cliente_imovel_id: clienteId,
      valor_total, desconto_avista_pct, entrada_pct, entrada_valor,
      parcelas_json, observacao, usuario_id: req.user.id,
    });

    // Marca lote como reservado
    await db.query(`UPDATE lote SET status = 'reservado' WHERE id = ? AND usuario_id = ?`, [lote_id, req.user.id]);

    return success(res, { id, cliente_imovel_id: clienteId }, 'Proposta criada', 201);
  } catch (err) { next(err); }
};

const aprovar = async (req, res, next) => {
  try {
    const p = await repo.findById(req.params.id, req.user.id);
    if (!p) return error(res, 'Proposta não encontrada', 404);

    // Converte proposta em contrato
    const parcelas = typeof p.parcelas_json === 'string' ? JSON.parse(p.parcelas_json) : p.parcelas_json;
    // Pega a opção de parcelamento escolhida (primeira linha da proposta como padrão, ou req.body.opcao_idx)
    const opcaoIdx = req.body.opcao_idx ?? 0;
    const opcao = parcelas[opcaoIdx];

    const contratoId = await contratoRepo.create({
      lote_id:          p.lote_id,
      cliente_imovel_id: p.cliente_imovel_id,
      data_contrato:    req.body.data_contrato || new Date().toISOString().slice(0, 10),
      valor_total:      p.valor_total,
      entrada_valor:    p.entrada_valor || 0,
      entrada_data:     req.body.entrada_data || null,
      num_parcelas:     opcao ? opcao.n : 1,
      dia_vencimento:   req.body.dia_vencimento || 10,
      taxa_juros:       opcao ? opcao.taxa : 0,
      observacao:       p.observacao,
      usuario_id:       req.user.id,
    });

    await repo.updateStatus(p.id, 'aprovada', req.user.id);

    return success(res, { contrato_id: contratoId }, 'Proposta aprovada — contrato gerado');
  } catch (err) { next(err); }
};

const recusar = async (req, res, next) => {
  try {
    const p = await repo.findById(req.params.id, req.user.id);
    if (!p) return error(res, 'Proposta não encontrada', 404);
    await repo.updateStatus(p.id, 'recusada', req.user.id);
    // Libera o lote novamente
    await db.query(`UPDATE lote SET status = 'disponivel' WHERE id = ? AND usuario_id = ?`, [p.lote_id, req.user.id]);
    return success(res, null, 'Proposta recusada');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await repo.remove(req.params.id, req.user.id);
    return success(res, null, 'Proposta removida');
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, getByLote, create, aprovar, recusar, remove };
