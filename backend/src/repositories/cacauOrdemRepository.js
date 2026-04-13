const pool = require('../config/database');

const cacauOrdemRepository = {
  async findAll({ data_inicio, data_fim, projeto_id, produtor_id, status, ano } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (ano)         { where += ' AND YEAR(o.data) = ?'; params.push(ano); }
    if (data_inicio) { where += ' AND o.data >= ?'; params.push(data_inicio); }
    if (data_fim)    { where += ' AND o.data <= ?'; params.push(data_fim); }
    if (projeto_id)  { where += ' AND o.projeto_id = ?'; params.push(projeto_id); }
    if (produtor_id) { where += ' AND o.produtor_id = ?'; params.push(produtor_id); }
    if (status)      { where += ' AND o.status = ?'; params.push(status); }

    const [rows] = await pool.query(`
      SELECT
        o.id, o.data, o.numero_ordem, o.credora,
        o.preco_arroba, o.kg, o.qtd_arrobas, o.lucro,
        o.status, o.data_prevista, o.observacao, o.created_at,
        pr.nome  AS projeto_nome,
        pd.nome  AS produtor_nome
      FROM cacau_ordem o
      LEFT JOIN projeto  pr ON pr.id = o.projeto_id
      LEFT JOIN produtor pd ON pd.id = o.produtor_id
      ${where}
      ORDER BY o.data DESC, o.id DESC
    `, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT o.*,
        pr.nome AS projeto_nome,
        pd.nome AS produtor_nome
      FROM cacau_ordem o
      LEFT JOIN projeto  pr ON pr.id = o.projeto_id
      LEFT JOIN produtor pd ON pd.id = o.produtor_id
      WHERE o.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO cacau_ordem
        (data, numero_ordem, projeto_id, produtor_id, credora,
         preco_arroba, kg, qtd_arrobas, lucro, status, data_prevista, observacao, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.data, data.numero_ordem || null,
       data.projeto_id || null, data.produtor_id || null,
       data.credora || null, data.preco_arroba || null,
       data.kg, data.qtd_arrobas,
       data.lucro || null, data.status || 'pendente',
       data.data_prevista || null, data.observacao || null, data.usuario_id]
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    await pool.query(
      `UPDATE cacau_ordem SET
        data=?, credora=?, kg=?, qtd_arrobas=?, observacao=?
       WHERE id=?`,
      [data.data, data.credora || null,
       data.kg, data.qtd_arrobas,
       data.observacao || null, id]
    );
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM cacau_ordem WHERE id=?', [id]);
  },

  async saldoDisponivel(credora, ano) {
    const whereAno = ano ? `AND YEAR(data) = ${pool.escape(ano)}` : '';
    // KG empresa = 50% da produção total do ano
    const [[prod]] = await pool.query(`
      SELECT COALESCE(SUM(qtd_arrobas * 15 * 0.5), 0) AS kg_empresa
      FROM producao_cacau WHERE 1=1 ${whereAno}
    `);
    // KG já ordenado para essa credora
    const [[ordens]] = await pool.query(`
      SELECT COALESCE(SUM(kg), 0) AS kg_ordenado
      FROM cacau_ordem WHERE credora = ? ${whereAno}
    `, [credora]);
    const kg_empresa  = Number(prod.kg_empresa);
    const kg_ordenado = Number(ordens.kg_ordenado);
    return { kg_empresa, kg_ordenado, saldo_kg: kg_empresa - kg_ordenado };
  },

  async resumo({ data_inicio, data_fim, credora, ano } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (ano)         { where += ' AND YEAR(data) = ?'; params.push(ano); }
    if (data_inicio) { where += ' AND data >= ?'; params.push(data_inicio); }
    if (data_fim)    { where += ' AND data <= ?'; params.push(data_fim); }
    if (credora)     { where += ' AND credora = ?'; params.push(credora); }

    const whereProducao = ano ? `WHERE YEAR(data) = ${pool.escape(ano)}` : '';

    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total_ordens,
        SUM(qtd_arrobas) AS total_arrobas,
        SUM(kg) AS total_kg,
        SUM(preco_arroba * qtd_arrobas) AS total_entradas,
        SUM(CASE WHEN status='recebido' THEN preco_arroba * qtd_arrobas ELSE 0 END) AS total_recebido,
        SUM(CASE WHEN status='pendente' THEN preco_arroba * qtd_arrobas ELSE 0 END) AS total_pendente,
        SUM(lucro) AS lucro_total
      FROM cacau_ordem ${where}
    `, params);

    const [[prod]] = await pool.query(`
      SELECT COALESCE(SUM(qtd_arrobas * 15 * 0.5), 0) AS kg_empresa
      FROM producao_cacau ${whereProducao}
    `);

    const kg_ordenado  = Number(rows[0].total_kg    || 0);
    const kg_empresa   = Number(prod.kg_empresa     || 0);
    const saldo_kg     = kg_empresa - kg_ordenado;

    return {
      ...rows[0],
      kg_empresa,
      saldo_kg,
    };
  },
};

module.exports = cacauOrdemRepository;
