const db = require('../config/database');

const findAll = async (usuario_id, filtros = {}) => {
  let where = 'c.usuario_id = ?';
  const params = [usuario_id];

  if (filtros.status) { where += ' AND c.status = ?'; params.push(filtros.status); }
  if (filtros.empreendimento_id) { where += ' AND q.empreendimento_id = ?'; params.push(filtros.empreendimento_id); }
  if (filtros.comprador_id) { where += ' AND c.comprador_id = ?'; params.push(filtros.comprador_id); }

  const [rows] = await db.query(
    `SELECT c.*,
       comp.nome_razao AS comprador_nome,
       l.numero AS lote_numero, l.area AS lote_area,
       q.nome AS quadra_nome,
       e.nome AS empreendimento_nome,
       (SELECT COUNT(*) FROM parcela_lote pl WHERE pl.contrato_id = c.id) AS total_parcelas,
       (SELECT COUNT(*) FROM parcela_lote pl WHERE pl.contrato_id = c.id AND pl.status = 'pago') AS parcelas_pagas,
       (SELECT COUNT(*) FROM parcela_lote pl WHERE pl.contrato_id = c.id AND pl.status = 'vencido') AS parcelas_vencidas,
       (SELECT COALESCE(SUM(pl.valor),0) FROM parcela_lote pl WHERE pl.contrato_id = c.id AND pl.status = 'pago') AS total_recebido
     FROM contrato_lote c
     JOIN lote l ON l.id = c.lote_id
     JOIN quadra q ON q.id = l.quadra_id
     JOIN empreendimento e ON e.id = q.empreendimento_id
     JOIN comprador comp ON comp.id = c.comprador_id
     WHERE ${where}
     ORDER BY c.created_at DESC`,
    params
  );
  return rows;
};

const findById = async (id, usuario_id) => {
  const [[contrato]] = await db.query(
    `SELECT c.*,
       comp.nome_razao AS comprador_nome, comp.cpf_cnpj, comp.telefone, comp.email,
       l.numero AS lote_numero, l.area AS lote_area, l.dimensoes AS lote_dimensoes,
       q.nome AS quadra_nome,
       e.nome AS empreendimento_nome, e.id AS empreendimento_id
     FROM contrato_lote c
     JOIN lote l ON l.id = c.lote_id
     JOIN quadra q ON q.id = l.quadra_id
     JOIN empreendimento e ON e.id = q.empreendimento_id
     JOIN comprador comp ON comp.id = c.comprador_id
     WHERE c.id = ? AND c.usuario_id = ? LIMIT 1`,
    [id, usuario_id]
  );
  if (!contrato) return null;

  const [parcelas] = await db.query(
    `SELECT pl.*, fp.nome AS forma_pagamento_nome, ct.numero AS conta_numero
     FROM parcela_lote pl
     LEFT JOIN forma_pagamento fp ON fp.id = pl.forma_pagamento_id
     LEFT JOIN conta ct ON ct.id = pl.conta_id
     WHERE pl.contrato_id = ?
     ORDER BY pl.numero`,
    [id]
  );
  contrato.parcelas = parcelas;
  return contrato;
};

const create = async (data) => {
  const { lote_id, comprador_id, data_contrato, valor_total, entrada_valor,
          entrada_data, num_parcelas, dia_vencimento, observacao, usuario_id } = data;
  const [result] = await db.query(
    `INSERT INTO contrato_lote
       (lote_id, comprador_id, data_contrato, valor_total, entrada_valor, entrada_data,
        num_parcelas, dia_vencimento, observacao, status, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo', ?)`,
    [lote_id, comprador_id, data_contrato, valor_total,
     entrada_valor || 0, entrada_data || null,
     num_parcelas, dia_vencimento || 10, observacao || null, usuario_id]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const { comprador_id, data_contrato, valor_total, entrada_valor, entrada_data,
          num_parcelas, dia_vencimento, observacao, status, usuario_id } = data;
  await db.query(
    `UPDATE contrato_lote SET
       comprador_id=?, data_contrato=?, valor_total=?, entrada_valor=?, entrada_data=?,
       num_parcelas=?, dia_vencimento=?, observacao=?, status=?
     WHERE id=? AND usuario_id=?`,
    [comprador_id, data_contrato, valor_total, entrada_valor || 0, entrada_data || null,
     num_parcelas, dia_vencimento || 10, observacao || null, status, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query(`DELETE FROM contrato_lote WHERE id=? AND usuario_id=?`, [id, usuario_id]);
};

module.exports = { findAll, findById, create, update, remove };
