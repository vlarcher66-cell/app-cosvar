const db = require('../config/database');

const findByContrato = async (contrato_id) => {
  const [rows] = await db.query(
    `SELECT pl.*, fp.nome AS forma_pagamento_nome, ct.numero AS conta_numero
     FROM parcela_lote pl
     LEFT JOIN forma_pagamento fp ON fp.id = pl.forma_pagamento_id
     LEFT JOIN conta ct ON ct.id = pl.conta_id
     WHERE pl.contrato_id = ?
     ORDER BY pl.numero`,
    [contrato_id]
  );
  return rows;
};

const findVencidas = async (usuario_id) => {
  const hoje = new Date().toISOString().slice(0, 10);
  const [rows] = await db.query(
    `SELECT pl.*,
       c.id AS contrato_id,
       comp.nome_razao AS comprador_nome,
       l.numero AS lote_numero, q.nome AS quadra_nome, e.nome AS empreendimento_nome
     FROM parcela_lote pl
     JOIN contrato_lote c ON c.id = pl.contrato_id
     JOIN lote l ON l.id = c.lote_id
     JOIN quadra q ON q.id = l.quadra_id
     JOIN empreendimento e ON e.id = q.empreendimento_id
     JOIN comprador comp ON comp.id = c.comprador_id
     WHERE pl.usuario_id = ? AND pl.status = 'pendente' AND pl.data_vencimento < ?
     ORDER BY pl.data_vencimento`,
    [usuario_id, hoje]
  );
  return rows;
};

const findByMes = async (usuario_id, mes, ano) => {
  const dataInicio = `${ano}-${String(mes).padStart(2,'0')}-01`;
  const dataFim    = new Date(ano, mes, 0).toISOString().slice(0, 10);
  const [rows] = await db.query(
    `SELECT pl.*,
       c.id AS contrato_id,
       comp.nome_razao AS comprador_nome,
       l.numero AS lote_numero, q.nome AS quadra_nome, e.nome AS empreendimento_nome
     FROM parcela_lote pl
     JOIN contrato_lote c ON c.id = pl.contrato_id
     JOIN lote l ON l.id = c.lote_id
     JOIN quadra q ON q.id = l.quadra_id
     JOIN empreendimento e ON e.id = q.empreendimento_id
     JOIN comprador comp ON comp.id = c.comprador_id
     WHERE pl.usuario_id = ? AND pl.data_vencimento BETWEEN ? AND ?
     ORDER BY pl.data_vencimento, comp.nome_razao`,
    [usuario_id, dataInicio, dataFim]
  );
  return rows;
};

const createBulk = async (parcelas) => {
  if (!parcelas.length) return;
  const values = parcelas.map(p => [
    p.contrato_id, p.numero, p.valor, p.data_vencimento, 'pendente', p.usuario_id
  ]);
  await db.query(
    `INSERT INTO parcela_lote (contrato_id, numero, valor, data_vencimento, status, usuario_id) VALUES ?`,
    [values]
  );
};

const baixar = async (id, { data_pagamento, conta_id, forma_pagamento_id, observacao }, usuario_id) => {
  await db.query(
    `UPDATE parcela_lote SET
       status='pago', data_pagamento=?, conta_id=?, forma_pagamento_id=?, observacao=?
     WHERE id=? AND usuario_id=?`,
    [data_pagamento, conta_id || null, forma_pagamento_id || null, observacao || null, id, usuario_id]
  );
};

const estornar = async (id, usuario_id) => {
  await db.query(
    `UPDATE parcela_lote SET status='pendente', data_pagamento=NULL, conta_id=NULL, forma_pagamento_id=NULL
     WHERE id=? AND usuario_id=?`,
    [id, usuario_id]
  );
};

// Atualiza status de pendente → vencido para parcelas em atraso
const atualizarVencidas = async (usuario_id) => {
  const hoje = new Date().toISOString().slice(0, 10);
  await db.query(
    `UPDATE parcela_lote SET status='vencido'
     WHERE status='pendente' AND data_vencimento < ? AND usuario_id=?`,
    [hoje, usuario_id]
  );
};

module.exports = { findByContrato, findVencidas, findByMes, createBulk, baixar, estornar, atualizarVencidas };
