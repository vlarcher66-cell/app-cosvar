const pool = require('../config/database');

const cacauBaixaRepository = {
  async findAll({ data_inicio, data_fim, comprador_id, ano } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (ano)          { where += ' AND YEAR(b.data) = ?'; params.push(ano); }
    if (data_inicio)  { where += ' AND b.data >= ?'; params.push(data_inicio); }
    if (data_fim)     { where += ' AND b.data <= ?'; params.push(data_fim); }
    if (comprador_id) { where += ' AND b.comprador_id = ?'; params.push(comprador_id); }

    const [rows] = await pool.query(`
      SELECT b.id, b.numero_ordem, b.data, b.comprador_id,
        c.nome AS credora,
        b.kg, b.qtd_arrobas, b.preco_arroba, b.valor_total, b.observacao, b.created_at
      FROM cacau_baixa b
      LEFT JOIN comprador c ON c.id = b.comprador_id
      ${where}
      ORDER BY b.data DESC, b.id DESC
    `, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT b.*, c.nome AS credora
      FROM cacau_baixa b
      LEFT JOIN comprador c ON c.id = b.comprador_id
      WHERE b.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO cacau_baixa (numero_ordem, data, comprador_id, kg, qtd_arrobas, preco_arroba, valor_total, observacao, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.numero_ordem || null, data.data, data.comprador_id || null, data.kg, data.qtd_arrobas, data.preco_arroba || null, data.valor_total || null, data.observacao || null, data.usuario_id]
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    await pool.query(
      `UPDATE cacau_baixa SET data=?, comprador_id=?, kg=?, qtd_arrobas=?, preco_arroba=?, valor_total=?, observacao=? WHERE id=?`,
      [data.data, data.comprador_id || null, data.kg, data.qtd_arrobas, data.preco_arroba || null, data.valor_total || null, data.observacao || null, id]
    );
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM cacau_baixa WHERE id=?', [id]);
  },

  // Saldo por credora: KG entregue vs KG baixado
  async saldoPorCredora({ ano } = {}) {
    const whereOrdem = ano ? `WHERE o.comprador_id IS NOT NULL AND YEAR(o.data) = ${pool.escape(ano)}` : 'WHERE o.comprador_id IS NOT NULL';
    const whereBaixa = ano ? `WHERE YEAR(b.data) = ${pool.escape(ano)}` : '';

    const [entregas] = await pool.query(`
      SELECT o.comprador_id, c.nome AS credora,
        SUM(o.kg) AS total_kg_entregue,
        SUM(o.qtd_arrobas) AS total_arrobas_entregue,
        COUNT(*) AS total_ordens
      FROM cacau_ordem o
      LEFT JOIN comprador c ON c.id = o.comprador_id
      ${whereOrdem}
      GROUP BY o.comprador_id, c.nome
    `);

    const [baixas] = await pool.query(`
      SELECT b.comprador_id,
        SUM(b.kg) AS total_kg_baixado,
        SUM(b.qtd_arrobas) AS total_arrobas_baixado,
        COUNT(*) AS total_baixas
      FROM cacau_baixa b
      ${whereBaixa}
      GROUP BY b.comprador_id
    `);

    const baixaMap = {};
    baixas.forEach(b => { baixaMap[b.comprador_id] = b; });

    return entregas.map(r => {
      const bx = baixaMap[r.comprador_id] || {};
      const kg_entregue = Number(r.total_kg_entregue || 0);
      const kg_baixado  = Number(bx.total_kg_baixado || 0);
      return {
        credora:                r.credora,
        comprador_id:           r.comprador_id,
        total_kg_entregue:      kg_entregue,
        total_arrobas_entregue: Number(r.total_arrobas_entregue || 0),
        total_ordens:           Number(r.total_ordens || 0),
        total_kg_baixado:       kg_baixado,
        total_arrobas_baixado:  Number(bx.total_arrobas_baixado || 0),
        total_baixas:           Number(bx.total_baixas || 0),
        saldo_kg:               kg_entregue - kg_baixado,
      };
    });
  },

  async saldoCredora(comprador_id) {
    const [[ent]] = await pool.query(
      `SELECT COALESCE(SUM(kg),0) AS total FROM cacau_ordem WHERE comprador_id = ?`, [comprador_id]
    );
    const [[bx]] = await pool.query(
      `SELECT COALESCE(SUM(kg),0) AS total FROM cacau_baixa WHERE comprador_id = ?`, [comprador_id]
    );
    return {
      kg_entregue: Number(ent.total),
      kg_baixado:  Number(bx.total),
      saldo_kg:    Number(ent.total) - Number(bx.total),
    };
  },

  // Saldo financeiro estimado: saldo_kg em arrobas × último preço praticado por credora
  async saldoFinanceiro({ ano } = {}) {
    const wOrdem = ano ? `AND YEAR(o.data) = ${pool.escape(ano)}` : '';
    const wBaixa = ano ? `WHERE YEAR(data) = ${pool.escape(ano)}` : '';
    const [rows] = await pool.query(`
      SELECT
        o.comprador_id,
        cp.nome AS credora,
        COALESCE(SUM(o.kg), 0)                                        AS kg_entregue,
        COALESCE(b.total_kg_baixado, 0)                               AS kg_baixado,
        COALESCE(SUM(o.kg), 0) - COALESCE(b.total_kg_baixado, 0)     AS saldo_kg,
        (COALESCE(SUM(o.kg), 0) - COALESCE(b.total_kg_baixado, 0)) / 15 AS saldo_arrobas,
        lp.ultimo_preco
      FROM cacau_ordem o
      LEFT JOIN comprador cp ON cp.id = o.comprador_id
      LEFT JOIN (
        SELECT comprador_id, SUM(kg) AS total_kg_baixado
        FROM cacau_baixa ${wBaixa} GROUP BY comprador_id
      ) b ON b.comprador_id = o.comprador_id
      LEFT JOIN (
        SELECT b1.comprador_id, b1.preco_arroba AS ultimo_preco
        FROM cacau_baixa b1
        INNER JOIN (
          SELECT comprador_id, MAX(id) AS max_id
          FROM cacau_baixa
          WHERE preco_arroba IS NOT NULL
          GROUP BY comprador_id
        ) b2 ON b1.comprador_id = b2.comprador_id AND b1.id = b2.max_id
      ) lp ON lp.comprador_id = o.comprador_id
      WHERE o.comprador_id IS NOT NULL ${wOrdem}
      GROUP BY o.comprador_id, cp.nome, b.total_kg_baixado, lp.ultimo_preco
    `);

    const total_saldo_financeiro = rows.reduce((acc, r) => {
      const arrobas = Number(r.saldo_arrobas) || 0;
      const preco   = Number(r.ultimo_preco)  || 0;
      return acc + (arrobas * preco);
    }, 0);

    return {
      por_credora: rows.map(r => ({
        credora:           r.credora,
        kg_entregue:       Number(r.kg_entregue),
        kg_baixado:        Number(r.kg_baixado),
        saldo_kg:          Number(r.saldo_kg),
        saldo_arrobas:     Number(r.saldo_arrobas),
        ultimo_preco:      Number(r.ultimo_preco || 0),
        saldo_financeiro:  Number(r.saldo_arrobas || 0) * Number(r.ultimo_preco || 0),
      })),
      total_saldo_financeiro,
    };
  },

  async anosDisponiveis() {
    const [rows] = await pool.query(`
      SELECT DISTINCT YEAR(data) AS ano FROM cacau_ordem WHERE data IS NOT NULL
      UNION
      SELECT DISTINCT YEAR(data) AS ano FROM cacau_baixa WHERE data IS NOT NULL
      ORDER BY ano DESC
    `);
    return rows.map(r => r.ano);
  },

  async vendasPorMes({ ano } = {}) {
    const where = ano ? `WHERE YEAR(data) = ${pool.escape(ano)}` : '';
    const [rows] = await pool.query(`
      SELECT
        DATE_FORMAT(data, '%Y-%m') AS mes,
        DATE_FORMAT(data, '%b/%y') AS mes_label,
        SUM(kg) AS total_kg,
        SUM(qtd_arrobas) AS total_arrobas,
        SUM(valor_total) AS total_valor,
        COUNT(*) AS total_vendas
      FROM cacau_baixa
      ${where}
      GROUP BY DATE_FORMAT(data, '%Y-%m'), DATE_FORMAT(data, '%b/%y')
      ORDER BY mes ASC
      LIMIT 12
    `);
    return rows.map(r => ({
      mes:           r.mes,
      mes_label:     r.mes_label,
      total_kg:      Number(r.total_kg || 0),
      total_arrobas: Number(r.total_arrobas || 0),
      total_valor:   Number(r.total_valor || 0),
      total_vendas:  Number(r.total_vendas || 0),
    }));
  },

  async resumoGeral({ ano } = {}) {
    const w = ano ? `WHERE YEAR(data) = ${pool.escape(ano)}` : '';
    const [[ent]] = await pool.query(`
      SELECT COUNT(*) AS total_ordens,
        COALESCE(SUM(kg),0) AS total_kg,
        COALESCE(SUM(qtd_arrobas),0) AS total_arrobas
      FROM cacau_ordem ${w}
    `);
    const [[bx]] = await pool.query(`
      SELECT COUNT(*) AS total_baixas,
        COALESCE(SUM(kg),0) AS total_kg_baixado,
        COALESCE(SUM(qtd_arrobas),0) AS total_arrobas_baixado
      FROM cacau_baixa ${w}
    `);
    return {
      total_ordens:          Number(ent.total_ordens),
      total_kg:              Number(ent.total_kg),
      total_arrobas:         Number(ent.total_arrobas),
      total_baixas:          Number(bx.total_baixas),
      total_kg_baixado:      Number(bx.total_kg_baixado),
      total_arrobas_baixado: Number(bx.total_arrobas_baixado),
    };
  },
};

module.exports = cacauBaixaRepository;
