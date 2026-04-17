const db = require('../config/database');

const findAll = async (usuario_id) => {
  const [rows] = await db.query(
    `SELECT p.*, l.numero AS lote_numero, l.area AS lote_area, l.dimensoes AS lote_dimensoes, l.valor AS lote_valor,
            q.nome AS quadra_nome, e.nome AS empreendimento_nome,
            c.nome AS cliente_nome, c.cpf_cnpj, c.telefone, c.email
     FROM proposta_lote p
     JOIN lote l ON l.id = p.lote_id
     JOIN quadra q ON q.id = l.quadra_id
     JOIN empreendimento e ON e.id = q.empreendimento_id
     LEFT JOIN cliente_imovel c ON c.id = p.cliente_imovel_id
     WHERE p.usuario_id = ?
     ORDER BY p.created_at DESC`,
    [usuario_id]
  );
  return rows;
};

const findById = async (id, usuario_id) => {
  const [[row]] = await db.query(
    `SELECT p.*, l.numero AS lote_numero, l.area AS lote_area, l.dimensoes AS lote_dimensoes, l.valor AS lote_valor,
            q.nome AS quadra_nome, e.nome AS empreendimento_nome,
            c.nome AS cliente_nome, c.cpf_cnpj, c.telefone, c.email, c.endereco AS cliente_endereco
     FROM proposta_lote p
     JOIN lote l ON l.id = p.lote_id
     JOIN quadra q ON q.id = l.quadra_id
     JOIN empreendimento e ON e.id = q.empreendimento_id
     LEFT JOIN cliente_imovel c ON c.id = p.cliente_imovel_id
     WHERE p.id = ? AND p.usuario_id = ? LIMIT 1`,
    [id, usuario_id]
  );
  return row || null;
};

const findByLote = async (lote_id, usuario_id) => {
  const [rows] = await db.query(
    `SELECT p.*, c.nome AS cliente_nome
     FROM proposta_lote p
     LEFT JOIN cliente_imovel c ON c.id = p.cliente_imovel_id
     WHERE p.lote_id = ? AND p.usuario_id = ?
     ORDER BY p.created_at DESC`,
    [lote_id, usuario_id]
  );
  return rows;
};

const create = async (data) => {
  const {
    lote_id, cliente_imovel_id, valor_total, desconto_avista_pct,
    entrada_pct, entrada_valor, parcelas_json, observacao, usuario_id,
  } = data;
  const [result] = await db.query(
    `INSERT INTO proposta_lote
      (lote_id, cliente_imovel_id, valor_total, desconto_avista_pct, entrada_pct, entrada_valor, parcelas_json, status, observacao, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?)`,
    [lote_id, cliente_imovel_id || null, valor_total, desconto_avista_pct || 0,
     entrada_pct || 0, entrada_valor || 0, JSON.stringify(parcelas_json || []),
     observacao || null, usuario_id]
  );
  return result.insertId;
};

const updateStatus = async (id, status, usuario_id) => {
  await db.query(
    `UPDATE proposta_lote SET status = ? WHERE id = ? AND usuario_id = ?`,
    [status, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query(
    `DELETE FROM proposta_lote WHERE id = ? AND usuario_id = ?`,
    [id, usuario_id]
  );
};

module.exports = { findAll, findById, findByLote, create, updateStatus, remove };
