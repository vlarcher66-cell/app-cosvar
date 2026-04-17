const db = require('../config/database');

const findAll = async (usuario_id) => {
  const [rows] = await db.query(
    `SELECT * FROM cliente_imovel WHERE usuario_id = ? ORDER BY nome`,
    [usuario_id]
  );
  return rows;
};

const findById = async (id, usuario_id) => {
  const [[row]] = await db.query(
    `SELECT * FROM cliente_imovel WHERE id = ? AND usuario_id = ? LIMIT 1`,
    [id, usuario_id]
  );
  return row || null;
};

const create = async (data) => {
  const { nome, cpf_cnpj, telefone, email, endereco, observacao, usuario_id } = data;
  const [result] = await db.query(
    `INSERT INTO cliente_imovel (nome, cpf_cnpj, telefone, email, endereco, observacao, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nome, cpf_cnpj || null, telefone || null, email || null, endereco || null, observacao || null, usuario_id]
  );
  return result.insertId;
};

const update = async (id, data, usuario_id) => {
  const { nome, cpf_cnpj, telefone, email, endereco, observacao } = data;
  await db.query(
    `UPDATE cliente_imovel SET nome=?, cpf_cnpj=?, telefone=?, email=?, endereco=?, observacao=?
     WHERE id = ? AND usuario_id = ?`,
    [nome, cpf_cnpj || null, telefone || null, email || null, endereco || null, observacao || null, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query(
    `DELETE FROM cliente_imovel WHERE id = ? AND usuario_id = ?`,
    [id, usuario_id]
  );
};

module.exports = { findAll, findById, create, update, remove };
