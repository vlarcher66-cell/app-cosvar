const db = require('../config/database');

/**
 * Retorna todos os movimentos de uma conta num período:
 *  - receitas recebidas (status='recebido')
 *  - pagamentos de despesa (despesa_pagamento)
 */
const getMovimentos = async (usuario_id, conta_id, mes, ano) => {
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim    = `${ano}-${String(mes).padStart(2, '0')}-31`;

  // Receitas da conta no período
  const [receitas] = await db.query(`
    SELECT
      r.id,
      'receita'               AS tipo,
      r.data,
      r.valor,
      r.conciliado,
      CONCAT(cr.nome, ' — ', COALESCE(dr.nome, '')) AS descricao,
      NULL                    AS forma_pagamento_nome,
      ct.numero               AS conta_numero,
      ct.tipo                 AS conta_tipo,
      b.nome                  AS banco_nome
    FROM receita r
    LEFT JOIN categoria_receita cr ON cr.id = r.categoria_id
    LEFT JOIN descricao_receita  dr ON dr.id = r.descricao_id
    LEFT JOIN conta ct              ON ct.id = r.conta_id
    LEFT JOIN banco b               ON b.id  = ct.banco_id
    WHERE r.usuario_id = ?
      AND r.conta_id   = ?
      AND r.status     = 'recebido'
      AND r.data BETWEEN ? AND ?
    ORDER BY r.data ASC, r.id ASC
  `, [usuario_id, conta_id, dataInicio, dataFim]);

  // Pagamentos de despesa da conta no período
  const [despesas] = await db.query(`
    SELECT
      dp.id,
      'despesa'               AS tipo,
      dp.data_pagamento       AS data,
      dp.valor,
      dp.conciliado,
      CONCAT(COALESCE(f.nome_razao, f.nome_fantasia, ''), ' — ', COALESCE(id2.nome, d.descricao, '')) AS descricao,
      fp.nome                 AS forma_pagamento_nome,
      ct.numero               AS conta_numero,
      ct.tipo                 AS conta_tipo,
      b.nome                  AS banco_nome
    FROM despesa_pagamento dp
    JOIN despesa d              ON d.id  = dp.despesa_id AND d.usuario_id = ?
    LEFT JOIN fornecedor f      ON f.id  = d.fornecedor_id
    LEFT JOIN item_despesa id2  ON id2.id = d.item_id
    LEFT JOIN forma_pagamento fp ON fp.id = dp.forma_pagamento_id
    LEFT JOIN conta ct           ON ct.id = dp.conta_id
    LEFT JOIN banco b            ON b.id  = ct.banco_id
    WHERE dp.conta_id = ?
      AND dp.data_pagamento BETWEEN ? AND ?
    ORDER BY dp.data_pagamento ASC, dp.id ASC
  `, [usuario_id, conta_id, dataInicio, dataFim]);

  return [...receitas, ...despesas].sort((a, b) => {
    const d = new Date(a.data) - new Date(b.data);
    return d !== 0 ? d : (a.tipo === 'receita' ? -1 : 1);
  });
};

/**
 * Marca/desmarca um lançamento como conciliado
 */
const setConciliado = async (tipo, id, conciliado, usuario_id) => {
  if (tipo === 'receita') {
    await db.query(
      'UPDATE receita SET conciliado = ? WHERE id = ? AND usuario_id = ?',
      [conciliado ? 1 : 0, id, usuario_id]
    );
  } else {
    // Verifica que o pagamento pertence ao usuário via despesa
    await db.query(
      `UPDATE despesa_pagamento dp
       JOIN despesa d ON d.id = dp.despesa_id AND d.usuario_id = ?
       SET dp.conciliado = ?
       WHERE dp.id = ?`,
      [usuario_id, conciliado ? 1 : 0, id]
    );
  }
};

/**
 * Retorna o saldo inicial da conta
 */
const getSaldoInicial = async (conta_id, usuario_id) => {
  const [[row]] = await db.query(
    'SELECT saldo_inicial FROM conta WHERE id = ? AND usuario_id = ?',
    [conta_id, usuario_id]
  );
  return row ? Number(row.saldo_inicial || 0) : 0;
};

module.exports = { getMovimentos, setConciliado, getSaldoInicial };
