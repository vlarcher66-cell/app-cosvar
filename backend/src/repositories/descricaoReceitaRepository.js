const db = require('../config/database');

const findAll = async (usuario_id) => {
  const [rows] = await db.query(
    `SELECT d.*, c.nome AS categoria_nome
     FROM descricao_receita d
     JOIN categoria_receita c ON c.id = d.categoria_id
     WHERE d.usuario_id = ?
     ORDER BY c.nome, d.nome`,
    [usuario_id]
  );
  return rows;
};

const findByCategoria = async (categoria_id, usuario_id) => {
  const [rows] = await db.query(
    'SELECT * FROM descricao_receita WHERE categoria_id = ? AND usuario_id = ? ORDER BY nome',
    [categoria_id, usuario_id]
  );
  return rows;
};

const findById = async (id, usuario_id) => {
  const [rows] = await db.query(
    'SELECT * FROM descricao_receita WHERE id = ? AND usuario_id = ? LIMIT 1',
    [id, usuario_id]
  );
  return rows[0] || null;
};

const create = async ({ nome, categoria_id, usuario_id }) => {
  const [result] = await db.query(
    'INSERT INTO descricao_receita (nome, categoria_id, usuario_id) VALUES (?, ?, ?)',
    [nome, categoria_id, usuario_id]
  );
  return result.insertId;
};

const update = async (id, { nome, categoria_id, usuario_id }) => {
  await db.query(
    'UPDATE descricao_receita SET nome=?, categoria_id=? WHERE id=? AND usuario_id=?',
    [nome, categoria_id, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query('DELETE FROM descricao_receita WHERE id=? AND usuario_id=?', [id, usuario_id]);
};

module.exports = { findAll, findByCategoria, findById, create, update, remove };
