const db = require('../config/database');

const findAll = async () => {
  const [rows] = await db.query(
    'SELECT id, nome, email, perfil, status, created_at FROM usuario ORDER BY nome'
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(
    'SELECT id, nome, email, perfil, status, created_at FROM usuario WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM usuario WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
};

const create = async ({ nome, email, senha, perfil, status }) => {
  const [result] = await db.query(
    'INSERT INTO usuario (nome, email, senha, perfil, status) VALUES (?, ?, ?, ?, ?)',
    [nome, email, senha, perfil || 'usuario', status || 'ativo']
  );
  return result.insertId;
};

const update = async (id, { nome, email, perfil, status }) => {
  await db.query(
    'UPDATE usuario SET nome=?, email=?, perfil=?, status=? WHERE id=?',
    [nome, email, perfil, status, id]
  );
};

const updateSenha = async (id, senha) => {
  await db.query('UPDATE usuario SET senha=? WHERE id=?', [senha, id]);
};

const remove = async (id) => {
  await db.query('DELETE FROM usuario WHERE id=?', [id]);
};

module.exports = { findAll, findById, findByEmail, create, update, updateSenha, remove };
