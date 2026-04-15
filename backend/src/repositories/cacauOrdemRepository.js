const pool = require('../config/database');

const cacauOrdemRepository = {
  async findAll({ data_inicio, data_fim, comprador_id, status, ano } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (ano)          { where += ' AND YEAR(o.data) = ?'; params.push(ano); }
    if (data_inicio)  { where += ' AND o.data >= ?'; params.push(data_inicio); }
    if (data_fim)     { where += ' AND o.data <= ?'; params.push(data_fim); }
    if (comprador_id) { where += ' AND o.comprador_id = ?'; params.push(comprador_id); }
    if (status)       { where += ' AND o.status = ?'; params.push(status); }

    const [rows] = await pool.query(`
      SELECT
        o.id, o.data, o.numero_ordem, o.comprador_id,
        c.nome AS credora,
        o.preco_arroba, o.kg, o.qtd_arrobas, o.lucro,
        o.status, o.data_prevista, o.observacao, o.created_at
      FROM cacau_ordem o
      LEFT JOIN comprador c ON c.id = o.comprador_id
      ${where}
      ORDER BY o.data DESC, o.id DESC
    `, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT o.*, c.nome AS credora
      FROM cacau_ordem o
      LEFT JOIN comprador c ON c.id = o.comprador_id
      WHERE o.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO cacau_ordem
        (data, numero_ordem, comprador_id, kg, qtd_arrobas, observacao, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.data, data.numero_ordem || null,
       data.comprador_id || null,
       data.kg, data.qtd_arrobas,
       data.observacao || null, data.usuario_id]
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    await pool.query(
      `UPDATE cacau_ordem SET data=?, comprador_id=?, kg=?, qtd_arrobas=?, observacao=? WHERE id=?`,
      [data.data, data.comprador_id || null, data.kg, data.qtd_arrobas, data.observacao || null, id]
    );
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM cacau_ordem WHERE id=?', [id]);
  },

  async saldoDisponivel(comprador_id, ano) {
    const whereAno = ano ? `AND YEAR(data) = ${pool.escape(ano)}` : '';
    const [[prod]] = await pool.query(`
      SELECT COALESCE(SUM(qtd_arrobas * 15 * 0.5), 0) AS kg_empresa
      FROM producao_cacau WHERE 1=1 ${whereAno}
    `);
    const [[ordens]] = await pool.query(`
      SELECT COALESCE(SUM(kg), 0) AS kg_ordenado
      FROM cacau_ordem WHERE comprador_id = ? ${whereAno}
    `, [comprador_id]);
    const kg_empresa  = Number(prod.kg_empresa);
    const kg_ordenado = Number(ordens.kg_ordenado);
    return { kg_empresa, kg_ordenado, saldo_kg: kg_empresa - kg_ordenado };
  },

  async resumo({ data_inicio, data_fim, comprador_id, ano } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (ano)          { where += ' AND YEAR(data) = ?'; params.push(ano); }
    if (data_inicio)  { where += ' AND data >= ?'; params.push(data_inicio); }
    if (data_fim)     { where += ' AND data <= ?'; params.push(data_fim); }
    if (comprador_id) { where += ' AND comprador_id = ?'; params.push(comprador_id); }

    const whereProducao = ano ? `WHERE YEAR(data) = ${pool.escape(ano)}` : '';

    const [rows] = await pool.query(`
      SELECT COUNT(*) AS total_ordens, SUM(qtd_arrobas) AS total_arrobas,
        SUM(kg) AS total_kg, SUM(lucro) AS lucro_total
      FROM cacau_ordem ${where}
    `, params);

    const [[prod]] = await pool.query(`
      SELECT COALESCE(SUM(qtd_arrobas * 15 * 0.5), 0) AS kg_empresa
      FROM producao_cacau ${whereProducao}
    `);

    return {
      ...rows[0],
      kg_empresa: Number(prod.kg_empresa || 0),
      saldo_kg:   Number(prod.kg_empresa || 0) - Number(rows[0].total_kg || 0),
    };
  },
};

module.exports = cacauOrdemRepository;
