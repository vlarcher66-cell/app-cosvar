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
     ORDER BY e.nome`
  );
  return rows;
};

const findById = async (id) => {
  const [[emp]] = await db.query(
    `SELECT * FROM empreendimento WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!emp) return null;

  let quadras = [];
  try {
    const [rows] = await db.query(
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
    quadras = rows;
  } catch (e) {
    console.log('⚠️ quadra/lote ainda não existe:', e.message);
  }
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

const update = async (id, { nome, cidade, bairro, descricao }) => {
  await db.query(
    `UPDATE empreendimento SET nome=?, cidade=?, bairro=?, descricao=? WHERE id=?`,
    [nome, cidade || null, bairro || null, descricao || null, id]
  );
};

const remove = async (id) => {
  await db.query(`DELETE FROM empreendimento WHERE id=?`, [id]);
};

module.exports = { findAll, findById, create, update, remove };
