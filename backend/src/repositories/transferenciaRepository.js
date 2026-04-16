const db = require('../config/database');

const findAll = async (usuario_id, filters = {}) => {
  let sql = `
    SELECT t.*,
      co.numero AS origem_numero, co.tipo AS origem_tipo, bo.nome AS origem_banco,
      cd.numero AS destino_numero, cd.tipo AS destino_tipo, bd.nome AS destino_banco
    FROM transferencia t
    JOIN conta co  ON co.id = t.conta_origem_id
    JOIN banco bo  ON bo.id = co.banco_id
    JOIN conta cd  ON cd.id = t.conta_destino_id
    JOIN banco bd  ON bd.id = cd.banco_id
    WHERE t.usuario_id = ?
  `;
  const params = [usuario_id];
  if (filters.data_inicio) { sql += ' AND t.data >= ?'; params.push(filters.data_inicio); }
  if (filters.data_fim)    { sql += ' AND t.data <= ?'; params.push(filters.data_fim); }
  sql += ' ORDER BY t.data DESC, t.id DESC';
  const [rows] = await db.query(sql, params);
  return rows;
};

const findById = async (id, usuario_id) => {
  const [[row]] = await db.query(
    `SELECT t.*,
      co.numero AS origem_numero, co.tipo AS origem_tipo, bo.nome AS origem_banco,
      cd.numero AS destino_numero, cd.tipo AS destino_tipo, bd.nome AS destino_banco
     FROM transferencia t
     JOIN conta co ON co.id = t.conta_origem_id
     JOIN banco bo ON bo.id = co.banco_id
     JOIN conta cd ON cd.id = t.conta_destino_id
     JOIN banco bd ON bd.id = cd.banco_id
     WHERE t.id = ? AND t.usuario_id = ? LIMIT 1`,
    [id, usuario_id]
  );
  return row || null;
};

const create = async ({ conta_origem_id, conta_destino_id, valor, data, observacao, usuario_id }) => {
  const [result] = await db.query(
    `INSERT INTO transferencia (conta_origem_id, conta_destino_id, valor, data, observacao, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [conta_origem_id, conta_destino_id, valor, data, observacao || null, usuario_id]
  );
  return result.insertId;
};

const update = async (id, { conta_origem_id, conta_destino_id, valor, data, observacao, usuario_id }) => {
  await db.query(
    `UPDATE transferencia SET conta_origem_id=?, conta_destino_id=?, valor=?, data=?, observacao=?
     WHERE id=? AND usuario_id=?`,
    [conta_origem_id, conta_destino_id, valor, data, observacao || null, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query('DELETE FROM transferencia WHERE id=? AND usuario_id=?', [id, usuario_id]);
};

module.exports = { findAll, findById, create, update, remove };
