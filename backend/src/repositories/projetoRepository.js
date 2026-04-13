const db = require('../config/database');

const findAll = async (usuario_id) => {
  const [rows] = await db.query(
    'SELECT * FROM projeto WHERE usuario_id = ? ORDER BY nome',
    [usuario_id]
  );
  return rows;
};

const findById = async (id, usuario_id) => {
  const [rows] = await db.query(
    'SELECT * FROM projeto WHERE id = ? AND usuario_id = ? LIMIT 1',
    [id, usuario_id]
  );
  return rows[0] || null;
};

const create = async ({ nome, descricao, data_inicio, data_fim, status, usuario_id }) => {
  const [result] = await db.query(
    'INSERT INTO projeto (nome, descricao, data_inicio, data_fim, status, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
    [nome, descricao, data_inicio, data_fim, status || 'ativo', usuario_id]
  );
  return result.insertId;
};

const update = async (id, { nome, descricao, data_inicio, data_fim, status, usuario_id }) => {
  await db.query(
    'UPDATE projeto SET nome=?, descricao=?, data_inicio=?, data_fim=?, status=? WHERE id=? AND usuario_id=?',
    [nome, descricao, data_inicio, data_fim, status, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query('DELETE FROM projeto WHERE id=? AND usuario_id=?', [id, usuario_id]);
};

module.exports = { findAll, findById, create, update, remove };
