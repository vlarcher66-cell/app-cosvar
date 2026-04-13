/**
 * Factory para repositórios simples de cadastro (nome, usuario_id)
 * Reduz boilerplate nos cadastros com estrutura idêntica
 */
const db = require('../config/database');

const makeRepo = (tableName, extraFields = []) => {
  const fieldList = ['nome', ...extraFields].join(', ');
  const placeholders = ['nome', ...extraFields].map(() => '?').join(', ');

  const findAll = async (usuario_id) => {
    const [rows] = await db.query(
      `SELECT * FROM ${tableName} WHERE usuario_id = ? ORDER BY nome`,
      [usuario_id]
    );
    return rows;
  };

  const findById = async (id, usuario_id) => {
    const [rows] = await db.query(
      `SELECT * FROM ${tableName} WHERE id = ? AND usuario_id = ? LIMIT 1`,
      [id, usuario_id]
    );
    return rows[0] || null;
  };

  const create = async (data) => {
    const values = ['nome', ...extraFields].map(f => data[f]);
    values.push(data.usuario_id);
    const [result] = await db.query(
      `INSERT INTO ${tableName} (${fieldList}, usuario_id) VALUES (${placeholders}, ?)`,
      values
    );
    return result.insertId;
  };

  const update = async (id, data) => {
    const setClause = ['nome', ...extraFields].map(f => `${f} = ?`).join(', ');
    const values = ['nome', ...extraFields].map(f => data[f]);
    values.push(id, data.usuario_id);
    await db.query(
      `UPDATE ${tableName} SET ${setClause} WHERE id = ? AND usuario_id = ?`,
      values
    );
  };

  const remove = async (id, usuario_id) => {
    await db.query(
      `DELETE FROM ${tableName} WHERE id = ? AND usuario_id = ?`,
      [id, usuario_id]
    );
  };

  return { findAll, findById, create, update, remove };
};

module.exports = { makeRepo };
