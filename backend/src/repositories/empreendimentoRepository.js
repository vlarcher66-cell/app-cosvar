const db = require('../config/database');

const findAll = async () => {
  const [rows] = await db.query(
    `SELECT e.id, e.nome, e.cidade, e.bairro, e.descricao,
       (SELECT COUNT(*) FROM quadra q WHERE q.empreendimento_id = e.id) AS total_quadras,
       (SELECT COUNT(*) FROM lote l JOIN quadra q ON q.id = l.quadra_id WHERE q.empreendimento_id = e.id) AS total_lotes,
       (SELECT COUNT(*) FROM lote l JOIN quadra q ON q.id = l.quadra_id WHERE q.empreendimento_id = e.id AND l.status = 'disponivel') AS lotes_disponiveis,
       (SELECT COUNT(*) FROM lote l JOIN quadra q ON q.id = l.quadra_id WHERE q.empreendimento_id = e.id AND l.status = 'vendido') AS lotes_vendidos,
       (SELECT COUNT(*) FROM lote l JOIN quadra q ON q.id = l.quadra_id WHERE q.empreendimento_id = e.id AND l.status = 'reservado') AS lotes_reservados
     FROM empreendimento e
     WHERE e.nome NOT LIKE '__limpo%'
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
      `SELECT q.id, q.nome, q.empreendimento_id,
         COUNT(l.id) AS total_lotes,
         SUM(CASE WHEN l.status = 'disponivel' THEN 1 ELSE 0 END) AS disponiveis,
         SUM(CASE WHEN l.status = 'vendido'    THEN 1 ELSE 0 END) AS vendidos,
         SUM(CASE WHEN l.status = 'reservado'  THEN 1 ELSE 0 END) AS reservados
       FROM quadra q
       LEFT JOIN lote l ON l.quadra_id = q.id
       WHERE q.empreendimento_id = ?
       GROUP BY q.id, q.nome, q.empreendimento_id
       ORDER BY q.nome`,
      [id]
    );
    quadras = rows;
  } catch (e) {
    console.log('⚠️ erro ao buscar quadras:', e.message);
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
