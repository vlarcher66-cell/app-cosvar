const db = require('../config/database');

const findByEmail = async (email) => {
  const [rows] = await db.query(
    'SELECT * FROM usuario WHERE email = ? AND status = "ativo" LIMIT 1',
    [email]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await db.query(
    'SELECT id, nome, email, perfil, status, created_at FROM usuario WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

module.exports = { findByEmail, findById };
