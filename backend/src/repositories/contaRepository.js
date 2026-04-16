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

/**
 * Calcula o saldo atual de uma conta:
 * saldo_inicial + receitas recebidas - despesas pagas - transferências saída + transferências entrada
 */
const getSaldo = async (id, usuario_id) => {
  const conta = await findById(id, usuario_id);
  if (!conta) return null;

  const saldoInicial = Number(conta.saldo_inicial || 0);

  // Receitas via receita_pagamento
  const [[{ total: receitasRP }]] = await db.query(
    `SELECT COALESCE(SUM(rp.valor), 0) AS total
     FROM receita_pagamento rp
     JOIN receita r ON r.id = rp.receita_id
     WHERE rp.conta_id = ? AND r.status = 'recebido' AND r.usuario_id = ?`,
    [id, usuario_id]
  );

  // Receitas diretas (sem parcelas em receita_pagamento)
  const [[{ total: receitasDiretas }]] = await db.query(
    `SELECT COALESCE(SUM(r.valor), 0) AS total
     FROM receita r
     WHERE r.conta_id = ? AND r.status = 'recebido' AND r.usuario_id = ?
       AND NOT EXISTS (SELECT 1 FROM receita_pagamento rp2 WHERE rp2.receita_id = r.id)`,
    [id, usuario_id]
  );

  // Despesas pagas
  const [[{ total: despesas }]] = await db.query(
    `SELECT COALESCE(SUM(dp.valor), 0) AS total
     FROM despesa_pagamento dp
     JOIN despesa d ON d.id = dp.despesa_id
     WHERE dp.conta_id = ? AND d.usuario_id = ?`,
    [id, usuario_id]
  );

  // Transferências saída
  const [[{ total: transferenciasSaida }]] = await db.query(
    `SELECT COALESCE(SUM(valor), 0) AS total
     FROM transferencia
     WHERE conta_origem_id = ? AND usuario_id = ?`,
    [id, usuario_id]
  );

  // Transferências entrada
  const [[{ total: transferenciasEntrada }]] = await db.query(
    `SELECT COALESCE(SUM(valor), 0) AS total
     FROM transferencia
     WHERE conta_destino_id = ? AND usuario_id = ?`,
    [id, usuario_id]
  );

  const saldo = saldoInicial
    + Number(receitasRP)
    + Number(receitasDiretas)
    - Number(despesas)
    - Number(transferenciasSaida)
    + Number(transferenciasEntrada);

  return { saldo, saldo_inicial: saldoInicial };
};

module.exports = { findAll, findById, create, update, remove, getFormas, setFormas, findByForma, getSaldo };
