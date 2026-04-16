const db = require('../config/database');

/**
 * Retorna todos os movimentos de uma conta num período:
 *  - receitas recebidas (status='recebido')
 *  - pagamentos de despesa (despesa_pagamento)
 */
const getMovimentos = async (usuario_id, conta_id, mes, ano) => {
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim    = `${ano}-${String(mes).padStart(2, '0')}-31`;

  // Receitas via receita_pagamento (parcelas individuais por conta/forma)
  // Cada parcela vira um movimento separado na conciliação
  const [receitasParcelas] = await db.query(`
    SELECT
      rp.id                   AS id,
      'receita'               AS tipo,
      r.data,
      rp.valor,
      r.conciliado,
      CONCAT(cr.nome, ' — ', COALESCE(dr.nome, '')) AS descricao,
      fp.nome                 AS forma_pagamento_nome,
      ct.numero               AS conta_numero,
      ct.tipo                 AS conta_tipo,
      b.nome                  AS banco_nome,
      r.id                    AS receita_id
    FROM receita_pagamento rp
    JOIN receita r              ON r.id  = rp.receita_id AND r.usuario_id = ? AND r.status = 'recebido'
    LEFT JOIN categoria_receita cr ON cr.id = r.categoria_id
    LEFT JOIN descricao_receita dr ON dr.id = r.descricao_id
    LEFT JOIN forma_pagamento fp   ON fp.id = rp.forma_pagamento_id
    LEFT JOIN conta ct             ON ct.id = rp.conta_id
    LEFT JOIN banco b              ON b.id  = ct.banco_id
    WHERE rp.conta_id = ?
      AND r.data BETWEEN ? AND ?
    ORDER BY r.data ASC, rp.id ASC
  `, [usuario_id, conta_id, dataInicio, dataFim]);

  // Receitas manuais (sem parcelas em receita_pagamento) — conta_id direto na receita
  const [receitasManuais] = await db.query(`
    SELECT
      r.id,
      'receita'               AS tipo,
      r.data,
      r.valor,
      r.conciliado,
      CONCAT(cr.nome, ' — ', COALESCE(dr.nome, '')) AS descricao,
      fp.nome                 AS forma_pagamento_nome,
      ct.numero               AS conta_numero,
      ct.tipo                 AS conta_tipo,
      b.nome                  AS banco_nome,
      r.id                    AS receita_id
    FROM receita r
    LEFT JOIN categoria_receita cr ON cr.id = r.categoria_id
    LEFT JOIN descricao_receita dr ON dr.id = r.descricao_id
    LEFT JOIN conta ct             ON ct.id = r.conta_id
    LEFT JOIN banco b              ON b.id  = ct.banco_id
    LEFT JOIN forma_pagamento fp   ON fp.id = r.forma_pagamento_id
    WHERE r.usuario_id = ?
      AND r.conta_id   = ?
      AND r.status     = 'recebido'
      AND r.data BETWEEN ? AND ?
      AND NOT EXISTS (SELECT 1 FROM receita_pagamento rp WHERE rp.receita_id = r.id)
    ORDER BY r.data ASC, r.id ASC
  `, [usuario_id, conta_id, dataInicio, dataFim]);

  const receitas = [...receitasParcelas, ...receitasManuais];

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
 * Para receitas vindas de receita_pagamento, o id é da parcela — resolve via receita_id
 */
const setConciliado = async (tipo, id, conciliado, usuario_id, receita_id) => {
  if (tipo === 'receita') {
    // Se vier receita_id (parcela de receita_pagamento), usa ele; senão usa id direto
    const rid = receita_id || id;
    await db.query(
      'UPDATE receita SET conciliado = ? WHERE id = ? AND usuario_id = ?',
      [conciliado ? 1 : 0, rid, usuario_id]
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
