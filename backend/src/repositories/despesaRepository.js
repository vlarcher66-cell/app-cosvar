const db = require('../config/database');

const findAll = async (usuario_id, filters = {}) => {
  let sql = `
    SELECT d.*,
      g.nome AS grupo_nome,
      s.nome AS subgrupo_nome,
      i.nome AS item_nome,
      f.nome AS fornecedor_nome,
      c2.nome AS comprador_nome,
      cc.nome AS centro_custo_nome,
      p.nome AS projeto_nome,
      ct.numero AS conta_numero
    FROM despesa d
    LEFT JOIN grupo_despesa g ON g.id = d.grupo_id
    LEFT JOIN subgrupo_despesa s ON s.id = d.subgrupo_id
    LEFT JOIN item_despesa i ON i.id = d.item_id
    LEFT JOIN fornecedor f ON f.id = d.fornecedor_id
    LEFT JOIN comprador c2 ON c2.id = d.comprador_id
    LEFT JOIN centro_custo cc ON cc.id = d.centro_custo_id
    LEFT JOIN projeto p ON p.id = d.projeto_id
    LEFT JOIN conta ct ON ct.id = d.conta_id
    WHERE d.usuario_id = ?
  `;
  const params = [usuario_id];

  if (filters.data_inicio) { sql += ' AND d.data >= ?'; params.push(filters.data_inicio); }
  if (filters.data_fim)    { sql += ' AND d.data <= ?'; params.push(filters.data_fim); }
  if (filters.status)      { sql += ' AND d.status = ?'; params.push(filters.status); }
  if (filters.grupo_id)      { sql += ' AND d.grupo_id = ?';      params.push(filters.grupo_id); }
  if (filters.fornecedor_id) { sql += ' AND d.fornecedor_id = ?'; params.push(filters.fornecedor_id); }
  if (filters.projeto_id)    { sql += ' AND d.projeto_id = ?';    params.push(filters.projeto_id); }

  sql += ' ORDER BY d.data DESC, d.id DESC';

  const [rows] = await db.query(sql, params);
  return rows;
};

const findById = async (id, usuario_id) => {
  const [rows] = await db.query(
    'SELECT * FROM despesa WHERE id = ? AND usuario_id = ? LIMIT 1',
    [id, usuario_id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const { grupo_id, subgrupo_id, item_id, fornecedor_id, comprador_id,
          centro_custo_id, projeto_id, conta_id, valor, data: dt,
          descricao, status, usuario_id } = data;
  const [result] = await db.query(
    `INSERT INTO despesa
     (grupo_id, subgrupo_id, item_id, fornecedor_id, comprador_id,
      centro_custo_id, projeto_id, conta_id, valor, data, descricao, status, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [grupo_id, subgrupo_id, item_id, fornecedor_id || null, comprador_id || null,
     centro_custo_id || null, projeto_id || null, conta_id || null, valor, dt,
     descricao, status || 'pendente', usuario_id]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const { grupo_id, subgrupo_id, item_id, fornecedor_id, comprador_id,
          centro_custo_id, projeto_id, conta_id, valor, data: dt,
          descricao, status, usuario_id } = data;
  await db.query(
    `UPDATE despesa SET grupo_id=?, subgrupo_id=?, item_id=?, fornecedor_id=?,
     comprador_id=?, centro_custo_id=?, projeto_id=?, conta_id=?,
     valor=?, data=?, descricao=?, status=?
     WHERE id=? AND usuario_id=?`,
    [grupo_id, subgrupo_id, item_id, fornecedor_id || null, comprador_id || null,
     centro_custo_id || null, projeto_id || null, conta_id || null, valor, dt,
     descricao, status, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query('DELETE FROM despesa WHERE id=? AND usuario_id=?', [id, usuario_id]);
};

// parcelas: [{ conta_id, forma_pagamento_id, valor, acrescimo, desconto }]
const baixar = async (id, { parcelas, data_pagamento, observacao, usuario_id }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Soma total pago, acréscimos e descontos das parcelas
    const valor_pago         = parcelas.reduce((a, p) => a + Number(p.valor || 0), 0);
    const acrescimo_total    = parcelas.reduce((a, p) => a + Number(p.acrescimo || 0), 0);
    const desconto_total     = parcelas.reduce((a, p) => a + Number(p.desconto || 0), 0);
    const conta_id_principal = parcelas[0]?.conta_id || null;

    // Atualiza a despesa
    await conn.query(
      `UPDATE despesa SET
        status = 'pago',
        conta_id = ?,
        data_pagamento = ?,
        valor_pago = ?,
        acrescimo = ?,
        desconto_pagamento = ?,
        descricao = CASE WHEN ? IS NOT NULL THEN ? ELSE descricao END
       WHERE id = ? AND usuario_id = ?`,
      [conta_id_principal, data_pagamento, valor_pago,
       acrescimo_total, desconto_total,
       observacao, observacao, id, usuario_id]
    );

    // Remove parcelas anteriores (se houver reprocessamento)
    await conn.query('DELETE FROM despesa_pagamento WHERE despesa_id = ?', [id]);

    // Insere uma linha por parcela
    for (const p of parcelas) {
      await conn.query(
        `INSERT INTO despesa_pagamento
         (despesa_id, conta_id, forma_pagamento_id, valor, data_pagamento, acrescimo, desconto, observacao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, p.conta_id || null, p.forma_pagamento_id || null,
         p.valor, data_pagamento,
         p.acrescimo || 0, p.desconto || 0, observacao || null]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Retorna as parcelas de pagamento de uma despesa
const getParcelas = async (despesa_id) => {
  const [rows] = await db.query(
    `SELECT dp.*,
       ct.numero AS conta_numero, ct.tipo AS conta_tipo,
       bco.nome AS banco_nome,
       fp.nome AS forma_pagamento_nome
     FROM despesa_pagamento dp
     LEFT JOIN conta ct ON ct.id = dp.conta_id
     LEFT JOIN banco bco ON bco.id = ct.banco_id
     LEFT JOIN forma_pagamento fp ON fp.id = dp.forma_pagamento_id
     WHERE dp.despesa_id = ?
     ORDER BY dp.id ASC`,
    [despesa_id]
  );
  return rows;
};

// Para dashboard
const totaisPorStatus = async (usuario_id, mes, ano) => {
  const [rows] = await db.query(
    `SELECT status, SUM(valor) AS total, COUNT(*) AS qtd
     FROM despesa
     WHERE usuario_id = ? AND MONTH(data) = ? AND YEAR(data) = ?
     GROUP BY status`,
    [usuario_id, mes, ano]
  );
  return rows;
};

const totaisPorGrupo = async (usuario_id, mes, ano) => {
  const [rows] = await db.query(
    `SELECT g.nome AS grupo, SUM(d.valor) AS total
     FROM despesa d
     JOIN grupo_despesa g ON g.id = d.grupo_id
     WHERE d.usuario_id = ? AND MONTH(d.data) = ? AND YEAR(d.data) = ?
     GROUP BY g.id, g.nome
     ORDER BY total DESC`,
    [usuario_id, mes, ano]
  );
  return rows;
};

const createBatch = async (itens) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const ids = [];
    for (const data of itens) {
      const { grupo_id, subgrupo_id, item_id, fornecedor_id, comprador_id,
              centro_custo_id, projeto_id, conta_id, valor, data: dt,
              descricao, status, usuario_id } = data;
      const [result] = await conn.query(
        `INSERT INTO despesa
         (grupo_id, subgrupo_id, item_id, fornecedor_id, comprador_id,
          centro_custo_id, projeto_id, conta_id, valor, data, descricao, status, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [grupo_id, subgrupo_id, item_id, fornecedor_id || null, comprador_id || null,
         centro_custo_id || null, projeto_id || null, conta_id || null, valor, dt,
         descricao || null, status || 'pendente', usuario_id]
      );
      ids.push(result.insertId);
    }
    await conn.commit();
    return ids;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { findAll, findById, create, createBatch, update, remove, baixar, getParcelas, totaisPorStatus, totaisPorGrupo };
