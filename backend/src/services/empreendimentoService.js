const repo = require('../repositories/empreendimentoRepository');
const db   = require('../config/database');

const findAll  = (usuario_id)       => repo.findAll();
const findById = (id, usuario_id)   => repo.findById(id);
const create   = (data)             => repo.create(data);
const update   = (id, data)         => repo.update(id, data);

const remove = async (id, usuario_id) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Delete lotes first, then quadras, then empreendimento
    await conn.query(
      `DELETE l FROM lote l
       JOIN quadra q ON q.id = l.quadra_id
       WHERE q.empreendimento_id = ?`, [id]
    );
    await conn.query(`DELETE FROM quadra WHERE empreendimento_id = ?`, [id]);
    await conn.query(`DELETE FROM empreendimento WHERE id = ?`, [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { findAll, findById, create, update, remove };
