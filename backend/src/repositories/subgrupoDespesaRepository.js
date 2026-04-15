const db = require('../config/database');

const findAll = async (usuario_id) => {
  const [rows] = await db.query(
    `SELECT s.*, g.nome AS grupo_nome
     FROM subgrupo_despesa s
     JOIN grupo_despesa g ON g.id = s.grupo_id
     ORDER BY g.nome, s.nome`
  );
  return rows;
};

const findByGrupo = async (grupo_id, usuario_id) => {
  const [rows] = await db.query(
    'SELECT * FROM subgrupo_despesa WHERE grupo_id = ? ORDER BY nome',
    [grupo_id]
  );
  return rows;
};

const findById = async (id, usuario_id) => {
  const [rows] = await db.query(
    'SELECT * FROM subgrupo_despesa WHERE id = ? AND usuario_id = ? LIMIT 1',
    [id, usuario_id]
  );
  return rows[0] || null;
};

const create = async ({ nome, grupo_id, usuario_id }) => {
  const [result] = await db.query(
    'INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES (?, ?, ?)',
    [nome, grupo_id, usuario_id]
  );
  return result.insertId;
};

const update = async (id, { nome, grupo_id, usuario_id }) => {
  await db.query(
    'UPDATE subgrupo_despesa SET nome=?, grupo_id=? WHERE id=? AND usuario_id=?',
    [nome, grupo_id, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query(
    'DELETE FROM subgrupo_despesa WHERE id=? AND usuario_id=?',
    [id, usuario_id]
  );
};

module.exports = { findAll, findByGrupo, findById, create, update, remove };
