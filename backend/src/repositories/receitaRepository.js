const db = require('../config/database');

const findAll = async (usuario_id, filters = {}) => {
  let sql = `
    SELECT r.*,
      c.nome  AS categoria_nome,
      d.nome  AS descricao_nome,
      p.nome  AS projeto_nome,
      ct.numero AS conta_numero,
      fp.nome AS forma_pagamento_nome,
      cb.numero_ordem AS cacau_venda_numero
    FROM receita r
    LEFT JOIN categoria_receita c  ON c.id  = r.categoria_id
    LEFT JOIN descricao_receita d  ON d.id  = r.descricao_id
    LEFT JOIN projeto p            ON p.id  = r.projeto_id
    LEFT JOIN conta ct             ON ct.id = r.conta_id
    LEFT JOIN forma_pagamento fp   ON fp.id = r.forma_pagamento_id
    LEFT JOIN cacau_baixa cb       ON cb.id = r.cacau_baixa_id
    WHERE r.usuario_id = ?
  `;
  const params = [usuario_id];

  if (filters.data_inicio)  { sql += ' AND r.data >= ?'; params.push(filters.data_inicio); }
  if (filters.data_fim)     { sql += ' AND r.data <= ?'; params.push(filters.data_fim); }
  if (filters.status)       { sql += ' AND r.status = ?'; params.push(filters.status); }
  if (filters.categoria_id) { sql += ' AND r.categoria_id = ?'; params.push(filters.categoria_id); }
  if (filters.projeto_id)   { sql += ' AND r.projeto_id = ?'; params.push(filters.projeto_id); }

  sql += ' ORDER BY r.data DESC, r.id DESC';

  const [rows] = await db.query(sql, params);
  return rows;
};

const findById = async (id, usuario_id) => {
  const [rows] = await db.query(
    `SELECT r.*,
      c.nome  AS categoria_nome,
      d.nome  AS descricao_nome,
      ct.numero AS conta_numero,
      fp.nome AS forma_pagamento_nome,
      cb.numero_ordem AS cacau_venda_numero
     FROM receita r
     LEFT JOIN categoria_receita c ON c.id = r.categoria_id
     LEFT JOIN descricao_receita d ON d.id = r.descricao_id
     LEFT JOIN conta ct            ON ct.id = r.conta_id
     LEFT JOIN forma_pagamento fp  ON fp.id = r.forma_pagamento_id
     LEFT JOIN cacau_baixa cb      ON cb.id = r.cacau_baixa_id
     WHERE r.id = ? AND r.usuario_id = ? LIMIT 1`,
    [id, usuario_id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const { categoria_id, descricao_id, projeto_id, conta_id,
          forma_pagamento_id, cacau_baixa_id,
          valor, data: dt, descricao, status, usuario_id } = data;
  const [result] = await db.query(
    `INSERT INTO receita
     (categoria_id, descricao_id, projeto_id, conta_id, forma_pagamento_id, cacau_baixa_id, valor, data, descricao, status, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [categoria_id, descricao_id, projeto_id || null, conta_id,
     forma_pagamento_id || null, cacau_baixa_id || null,
     valor, dt, descricao, status || 'pendente', usuario_id]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const { categoria_id, descricao_id, projeto_id, conta_id,
          forma_pagamento_id, valor, data: dt, descricao, status, usuario_id } = data;
  await db.query(
    `UPDATE receita SET categoria_id=?, descricao_id=?, projeto_id=?,
     conta_id=?, forma_pagamento_id=?, valor=?, data=?, descricao=?, status=?
     WHERE id=? AND usuario_id=?`,
    [categoria_id, descricao_id, projeto_id || null, conta_id,
     forma_pagamento_id || null, valor, dt, descricao, status, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query('DELETE FROM receita WHERE id=? AND usuario_id=?', [id, usuario_id]);
};

const totaisPorStatus = async (usuario_id, mes, ano) => {
  const [rows] = await db.query(
    `SELECT status, SUM(valor) AS total, COUNT(*) AS qtd
     FROM receita
     WHERE usuario_id = ? AND MONTH(data) = ? AND YEAR(data) = ?
     GROUP BY status`,
    [usuario_id, mes, ano]
  );
  return rows;
};

// Lança receita automática a partir de uma ordem de venda de cacau
const lancarReceitaVenda = async ({ baixa_id, valor, data, conta_id, observacao, usuario_id }) => {
  // Busca categoria e descrição padrão de Cacau pelo nome
  const [[cat]] = await db.query(
    `SELECT id FROM categoria_receita WHERE nome = 'Cacau' AND tipo = 'Venda' LIMIT 1`
  );
  if (!cat) throw { status: 500, message: 'Categoria de receita "Cacau" não encontrada. Configure no cadastro.' };

  const [[desc]] = await db.query(
    `SELECT id FROM descricao_receita WHERE nome = 'Venda de Cacau' AND categoria_id = ? LIMIT 1`,
    [cat.id]
  );
  if (!desc) throw { status: 500, message: 'Descrição de receita "Venda de Cacau" não encontrada. Configure no cadastro.' };

  const [result] = await db.query(
    `INSERT INTO receita (categoria_id, descricao_id, projeto_id, conta_id, valor, data, descricao, status, usuario_id)
     VALUES (?, ?, NULL, ?, ?, ?, ?, 'recebido', ?)`,
    [cat.id, desc.id, conta_id, valor, data, observacao || null, usuario_id]
  );
  return result.insertId;
};

// Retorna dados completos da venda de cacau + parcelas de receita vinculadas
const getProcesso = async (cacau_baixa_id, usuario_id) => {
  const [[baixa]] = await db.query(`
    SELECT b.*,
      cp.nome AS credora_nome
    FROM cacau_baixa b
    LEFT JOIN comprador cp ON cp.id = b.comprador_id
    WHERE b.id = ?
  `, [cacau_baixa_id]);

  if (!baixa) throw { statusCode: 404, message: 'Venda não encontrada' };

  const [parcelas] = await db.query(`
    SELECT r.id, r.valor, r.data, r.status, r.descricao,
      ct.numero AS conta_numero, ct.tipo AS conta_tipo,
      bco.nome AS banco_nome,
      fp.nome AS forma_pagamento_nome
    FROM receita r
    LEFT JOIN conta ct         ON ct.id = r.conta_id
    LEFT JOIN banco bco        ON bco.id = ct.banco_id
    LEFT JOIN forma_pagamento fp ON fp.id = r.forma_pagamento_id
    WHERE r.cacau_baixa_id = ? AND r.usuario_id = ?
    ORDER BY r.id ASC
  `, [cacau_baixa_id, usuario_id]);

  return { baixa, parcelas };
};

module.exports = { findAll, findById, create, update, remove, totaisPorStatus, lancarReceitaVenda, getProcesso };
