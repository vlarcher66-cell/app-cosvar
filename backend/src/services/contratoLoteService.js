const contratoRepo = require('../repositories/contratoLoteRepository');
const parcelaRepo  = require('../repositories/parcelaLoteRepository');
const loteRepo     = require('../repositories/loteRepository');

const findAll  = (usuario_id, filtros) => contratoRepo.findAll(usuario_id, filtros);
const findById = (id, usuario_id)      => contratoRepo.findById(id, usuario_id);

/**
 * Cria contrato + gera parcelas automaticamente + atualiza status do lote
 */
const create = async (data) => {
  const { lote_id, valor_total, entrada_valor, num_parcelas, dia_vencimento,
          data_contrato, usuario_id } = data;

  const contratoId = await contratoRepo.create(data);

  // Gera as parcelas
  const valorEntrada  = parseFloat(entrada_valor || 0);
  const valorParcelas = parseFloat(valor_total) - valorEntrada;
  const taxa          = parseFloat(data.taxa_juros || 0) / 100; // % a.m.

  // Se taxa > 0: sistema Price (juros compostos); senão: parcela simples
  let valorParcela;
  if (taxa > 0 && num_parcelas > 0) {
    // PMT = PV * i / (1 - (1+i)^-n)
    valorParcela = parseFloat((valorParcelas * taxa / (1 - Math.pow(1 + taxa, -num_parcelas))).toFixed(2));
  } else {
    valorParcela = parseFloat((valorParcelas / num_parcelas).toFixed(2));
  }

  const dataBase = new Date(data_contrato);
  const parcelas = [];

  for (let i = 1; i <= num_parcelas; i++) {
    const ano = dataBase.getFullYear();
    const mes = dataBase.getMonth() + i; // avança meses
    const venc = new Date(ano, mes, dia_vencimento || 10);
    parcelas.push({
      contrato_id:     contratoId,
      numero:          i,
      valor:           valorParcela,
      data_vencimento: venc.toISOString().slice(0, 10),
      usuario_id,
    });
  }

  await parcelaRepo.createBulk(parcelas);

  // Marca o lote como vendido
  await loteRepo.updateStatus(lote_id, 'vendido', usuario_id);

  return contratoId;
};

const update = async (id, data) => {
  await contratoRepo.update(id, data);
};

/**
 * Rescinde contrato: muda status do contrato + libera o lote
 */
const rescindir = async (id, usuario_id) => {
  const contrato = await contratoRepo.findById(id, usuario_id);
  if (!contrato) throw { statusCode: 404, message: 'Contrato não encontrado' };
  await contratoRepo.update(id, { ...contrato, status: 'rescindido', usuario_id });
  await loteRepo.updateStatus(contrato.lote_id, 'disponivel', usuario_id);
};

const remove = async (id, usuario_id) => {
  const contrato = await contratoRepo.findById(id, usuario_id);
  if (!contrato) throw { statusCode: 404, message: 'Contrato não encontrado' };
  await contratoRepo.remove(id, usuario_id);
  // Libera o lote se não houver outro contrato ativo
  await loteRepo.updateStatus(contrato.lote_id, 'disponivel', usuario_id);
};

module.exports = { findAll, findById, create, update, rescindir, remove };
