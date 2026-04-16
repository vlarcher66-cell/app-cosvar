const db = require('../config/database');

const findByEmpreendimento = async (empreendimento_id) => {
  const [rows] = await db.query(
    `SELECT l.*, q.nome AS quadra_nome, q.empreendimento_id,
       c.id AS contrato_id,
       comp.nome AS comprador_nome,
       c.valor_total, c.num_parcelas, c.status AS contrato_status,
       (SELECT COUNT(*) FROM parcela_lote pl WHERE pl.contrato_id = c.id AND pl.status = 'pago') AS parcelas_pagas,
       (SELECT COUNT(*) FROM parcela_lote pl WHERE pl.contrato_id = c.id AND pl.status = 'vencido') AS parcelas_vencidas
     FROM lote l
     JOIN quadra q ON q.id = l.quadra_id
     LEFT JOIN contrato_lote c ON c.lote_id = l.id AND c.status != 'rescindido'
     LEFT JOIN comprador comp ON comp.id = c.comprador_id
     WHERE q.empreendimento_id = ?
     ORDER BY q.nome, CAST(l.numero AS UNSIGNED), l.numero`,
    [empreendimento_id]
  );
  return rows;
};

const findById = async (id, usuario_id) => {
  const [[lote]] = await db.query(
    `SELECT l.*, q.nome AS quadra_nome, q.empreendimento_id,
       e.nome AS empreendimento_nome
     FROM lote l
     JOIN quadra q ON q.id = l.quadra_id
     JOIN empreendimento e ON e.id = q.empreendimento_id
     WHERE l.id = ? AND l.usuario_id = ? LIMIT 1`,
    [id, usuario_id]
  );
  return lote || null;
};

const create = async ({ quadra_id, numero, area, dimensoes, valor, status, observacao, usuario_id }) => {
  const [result] = await db.query(
    `INSERT INTO lote (quadra_id, numero, area, dimensoes, valor, status, observacao, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [quadra_id, numero, area || null, dimensoes || null, valor || null, status || 'disponivel', observacao || null, usuario_id]
  );
  return result.insertId;
};

const update = async (id, { quadra_id, numero, area, dimensoes, valor, status, observacao, usuario_id }) => {
  await db.query(
    `UPDATE lote SET quadra_id=?, numero=?, area=?, dimensoes=?, valor=?, status=?, observacao=?
     WHERE id=? AND usuario_id=?`,
    [quadra_id, numero, area || null, dimensoes || null, valor || null, status, observacao || null, id, usuario_id]
  );
};

const updateStatus = async (id, status, usuario_id) => {
  await db.query(
    `UPDATE lote SET status=? WHERE id=? AND usuario_id=?`,
    [status, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query(`DELETE FROM lote WHERE id=? AND usuario_id=?`, [id, usuario_id]);
};

// Cria múltiplos lotes de uma vez (bulk para uma quadra)
const createBulk = async (lotes) => {
  if (!lotes.length) return;
  const values = lotes.map(l => [l.quadra_id, l.numero, l.area || null, l.dimensoes || null, l.valor || null, 'disponivel', l.usuario_id]);
  await db.query(
    `INSERT INTO lote (quadra_id, numero, area, dimensoes, valor, status, usuario_id) VALUES ?`,
    [values]
  );
};

module.exports = { findByEmpreendimento, findById, create, update, updateStatus, remove, createBulk };
