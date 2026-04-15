const db = require('../config/database');

const findAll = async (usuario_id) => {
  const [rows] = await db.query(
    `SELECT i.*, s.nome AS subgrupo_nome, s.grupo_id, g.nome AS grupo_nome
     FROM item_despesa i
     JOIN subgrupo_despesa s ON s.id = i.subgrupo_id
     JOIN grupo_despesa g ON g.id = s.grupo_id
     ORDER BY g.nome, s.nome, i.nome`
  );
  return rows;
};

const findBySubgrupo = async (subgrupo_id, usuario_id) => {
  const [rows] = await db.query(
    'SELECT * FROM item_despesa WHERE subgrupo_id = ? ORDER BY nome',
    [subgrupo_id]
  );
  return rows;
};

const findById = async (id, usuario_id) => {
  const [rows] = await db.query(
    'SELECT * FROM item_despesa WHERE id = ? AND usuario_id = ? LIMIT 1',
    [id, usuario_id]
  );
  return rows[0] || null;
};

const create = async ({ nome, subgrupo_id, usuario_id }) => {
  const [result] = await db.query(
    'INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES (?, ?, ?)',
    [nome, subgrupo_id, usuario_id]
  );
  return result.insertId;
};

const update = async (id, { nome, subgrupo_id, usuario_id }) => {
  await db.query(
    'UPDATE item_despesa SET nome=?, subgrupo_id=? WHERE id=? AND usuario_id=?',
    [nome, subgrupo_id, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query('DELETE FROM item_despesa WHERE id=? AND usuario_id=?', [id, usuario_id]);
};

module.exports = { findAll, findBySubgrupo, findById, create, update, remove };
