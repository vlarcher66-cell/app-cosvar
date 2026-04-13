const db = require('../config/database');

const findAll = async (usuario_id) => {
  const [rows] = await db.query(
    `SELECT c.*, b.nome AS banco_nome
     FROM conta c
     JOIN banco b ON b.id = c.banco_id
     WHERE c.usuario_id = ?
     ORDER BY b.nome, c.numero`,
    [usuario_id]
  );
  return rows;
};

const findById = async (id, usuario_id) => {
  const [rows] = await db.query(
    `SELECT c.*, b.nome AS banco_nome
     FROM conta c
     JOIN banco b ON b.id = c.banco_id
     WHERE c.id = ? AND c.usuario_id = ? LIMIT 1`,
    [id, usuario_id]
  );
  return rows[0] || null;
};

const create = async ({ banco_id, agencia, numero, tipo, saldo_inicial, usuario_id }) => {
  const [result] = await db.query(
    'INSERT INTO conta (banco_id, agencia, numero, tipo, saldo_inicial, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
    [banco_id, agencia, numero, tipo, saldo_inicial || 0, usuario_id]
  );
  return result.insertId;
};

const update = async (id, { banco_id, agencia, numero, tipo, saldo_inicial, usuario_id }) => {
  await db.query(
    'UPDATE conta SET banco_id=?, agencia=?, numero=?, tipo=?, saldo_inicial=? WHERE id=? AND usuario_id=?',
    [banco_id, agencia, numero, tipo, saldo_inicial, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query('DELETE FROM conta WHERE id=? AND usuario_id=?', [id, usuario_id]);
};

module.exports = { findAll, findById, create, update, remove };
