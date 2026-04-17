const db = require('../config/database');

const findByContrato = async (contrato_id, usuario_id) => {
  const [rows] = await db.query(
    `SELECT d.* FROM documento_contrato d
     JOIN contrato_lote c ON c.id = d.contrato_id AND c.usuario_id = ?
     WHERE d.contrato_id = ?
     ORDER BY d.created_at DESC`,
    [usuario_id, contrato_id]
  );
  return rows;
};

const create = async ({ contrato_id, nome, tipo, url, public_id, tamanho, usuario_id }) => {
  const [result] = await db.query(
    `INSERT INTO documento_contrato (contrato_id, nome, tipo, url, public_id, tamanho, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [contrato_id, nome, tipo || null, url, public_id, tamanho || null, usuario_id]
  );
  return result.insertId;
};

const remove = async (id, usuario_id) => {
  const [[doc]] = await db.query(
    `SELECT d.public_id FROM documento_contrato d
     JOIN contrato_lote c ON c.id = d.contrato_id AND c.usuario_id = ?
     WHERE d.id = ? LIMIT 1`,
    [usuario_id, id]
  );
  if (!doc) return null;
  await db.query(`DELETE FROM documento_contrato WHERE id = ?`, [id]);
  return doc.public_id;
};

module.exports = { findByContrato, create, remove };
