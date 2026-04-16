const db = require('../config/database');

const findAll = async (usuario_id) => {
  const [rows] = await db.query(
    `SELECT e.*,
       (SELECT COUNT(*) FROM quadra q WHERE q.empreendimento_id = e.id) AS total_quadras,
       (SELECT COUNT(*) FROM lote l JOIN quadra q ON q.id = l.quadra_id WHERE q.empreendimento_id = e.id) AS total_lotes,
       (SELECT COUNT(*) FROM lote l JOIN quadra q ON q.id = l.quadra_id WHERE q.empreendimento_id = e.id AND l.status = 'disponivel') AS lotes_disponiveis,
       (SELECT COUNT(*) FROM lote l JOIN quadra q ON q.id = l.quadra_id WHERE q.empreendimento_id = e.id AND l.status = 'vendido') AS lotes_vendidos,
       (SELECT COUNT(*) FROM lote l JOIN quadra q ON q.id = l.quadra_id WHERE q.empreendimento_id = e.id AND l.status = 'reservado') AS lotes_reservados
     FROM empreendimento e
     WHERE e.usuario_id = ?
     ORDER BY e.nome`,
    [usuario_id]
  );
  return rows;
};

const findById = async (id, usuario_id) => {
  const [[emp]] = await db.query(
    `SELECT * FROM empreendimento WHERE id = ? AND usuario_id = ? LIMIT 1`,
    [id, usuario_id]
  );
  if (!emp) return null;

  const [quadras] = await db.query(
    `SELECT q.*,
       COUNT(l.id) AS total_lotes,
       SUM(l.status = 'disponivel') AS disponiveis,
       SUM(l.status = 'vendido')    AS vendidos,
       SUM(l.status = 'reservado')  AS reservados
     FROM quadra q
     LEFT JOIN lote l ON l.quadra_id = q.id
     WHERE q.empreendimento_id = ?
     GROUP BY q.id
     ORDER BY q.nome`,
    [id]
  );
  emp.quadras = quadras;
  return emp;
};

const create = async ({ nome, cidade, bairro, descricao, usuario_id }) => {
  const [result] = await db.query(
    `INSERT INTO empreendimento (nome, cidade, bairro, descricao, usuario_id) VALUES (?, ?, ?, ?, ?)`,
    [nome, cidade || null, bairro || null, descricao || null, usuario_id]
  );
  return result.insertId;
};

const update = async (id, { nome, cidade, bairro, descricao, usuario_id }) => {
  await db.query(
    `UPDATE empreendimento SET nome=?, cidade=?, bairro=?, descricao=? WHERE id=? AND usuario_id=?`,
    [nome, cidade || null, bairro || null, descricao || null, id, usuario_id]
  );
};

const remove = async (id, usuario_id) => {
  await db.query(`DELETE FROM empreendimento WHERE id=? AND usuario_id=?`, [id, usuario_id]);
};

module.exports = { findAll, findById, create, update, remove };
