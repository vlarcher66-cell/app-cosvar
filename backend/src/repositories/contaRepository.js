const db = require('../config/database');

const findAll = async (usuario_id) => {
  const [rows] = await db.query(
    `SELECT c.*, b.nome AS banco_nome,
       (SELECT GROUP_CONCAT(cfp.forma_pagamento_id)
        FROM conta_forma_pagamento cfp WHERE cfp.conta_id = c.id) AS formas_ids
     FROM conta c
     JOIN banco b ON b.id = c.banco_id
     WHERE c.usuario_id = ?
     ORDER BY b.nome, c.numero`,
    [usuario_id]
  );
  return rows.map(r => ({
    ...r,
    formas_ids: r.formas_ids ? r.formas_ids.split(',').map(Number) : [],
  }));
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

const getFormas = async (conta_id) => {
  const [rows] = await db.query(
    `SELECT forma_pagamento_id AS id, fp.nome
     FROM conta_forma_pagamento cfp
     JOIN forma_pagamento fp ON fp.id = cfp.forma_pagamento_id
     WHERE cfp.conta_id = ?
     ORDER BY fp.nome`,
    [conta_id]
  );
  return rows;
};

const setFormas = async (conta_id, forma_ids) => {
  await db.query('DELETE FROM conta_forma_pagamento WHERE conta_id = ?', [conta_id]);
  if (forma_ids && forma_ids.length > 0) {
    const values = forma_ids.map(fid => [conta_id, fid]);
    await db.query('INSERT INTO conta_forma_pagamento (conta_id, forma_pagamento_id) VALUES ?', [values]);
  }
};

// Retorna contas que aceitam uma determinada forma de pagamento
const findByForma = async (usuario_id, forma_pagamento_id) => {
  const [rows] = await db.query(
    `SELECT c.*, b.nome AS banco_nome
     FROM conta c
     JOIN banco b ON b.id = c.banco_id
     JOIN conta_forma_pagamento cfp ON cfp.conta_id = c.id AND cfp.forma_pagamento_id = ?
     WHERE c.usuario_id = ?
     ORDER BY b.nome, c.numero`,
    [forma_pagamento_id, usuario_id]
  );
  return rows;
};

module.exports = { findAll, findById, create, update, remove, getFormas, setFormas, findByForma };
