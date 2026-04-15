const pool = require('../config/database');

const producaoCacauRepository = {
  async findAll({ data_inicio, data_fim, projeto_id, produtor_id } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (data_inicio) { where += ' AND p.data >= ?'; params.push(data_inicio); }
    if (data_fim)    { where += ' AND p.data <= ?'; params.push(data_fim); }
    if (projeto_id)  { where += ' AND p.projeto_id = ?'; params.push(projeto_id); }
    if (produtor_id) { where += ' AND p.produtor_id = ?'; params.push(produtor_id); }

    const [rows] = await pool.query(`
      SELECT
        p.id, p.data, p.producao, p.preco_kg, p.qtd_arrobas, p.sacas,
        p.cmv_kg, p.lucro_kg, p.observacao, p.created_at,
        pr.nome  AS projeto_nome,
        pd.nome  AS produtor_nome,
        (p.qtd_arrobas * 15) AS total_kg,
        (p.lucro_kg * p.qtd_arrobas * 15) AS lucro_total
      FROM producao_cacau p
      LEFT JOIN projeto  pr ON pr.id = p.projeto_id
      LEFT JOIN produtor pd ON pd.id = p.produtor_id
      ${where}
      ORDER BY p.data DESC, p.id DESC
    `, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT p.*,
        pr.nome AS projeto_nome,
        pd.nome AS produtor_nome
      FROM producao_cacau p
      LEFT JOIN projeto  pr ON pr.id = p.projeto_id
      LEFT JOIN produtor pd ON pd.id = p.produtor_id
      WHERE p.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const produtor_id = parseInt(data.produtor_id) || null;
    const projeto_id  = parseInt(data.projeto_id)  || null;
    const [result] = await pool.query(
      `INSERT INTO producao_cacau
        (data, projeto_id, produtor_id, producao, preco_kg, qtd_arrobas, sacas, cmv_kg, lucro_kg, observacao, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.data, projeto_id, produtor_id, data.producao,
       data.preco_kg || null, data.qtd_arrobas, data.sacas || null, data.cmv_kg || null,
       data.lucro_kg || null, data.observacao || null, data.usuario_id]
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const produtor_id = parseInt(data.produtor_id) || null;
    const projeto_id  = parseInt(data.projeto_id)  || null;
    await pool.query(
      `UPDATE producao_cacau SET
        data=?, projeto_id=?, produtor_id=?, producao=?, preco_kg=?,
        qtd_arrobas=?, sacas=?, cmv_kg=?, lucro_kg=?, observacao=?
       WHERE id=?`,
      [data.data, projeto_id, produtor_id, data.producao,
       data.preco_kg || null, data.qtd_arrobas, data.sacas || null, data.cmv_kg || null,
       data.lucro_kg || null, data.observacao || null, id]
    );
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM producao_cacau WHERE id=?', [id]);
  },

  async totais({ data_inicio, data_fim, projeto_id, produtor_id } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (data_inicio) { where += ' AND data >= ?'; params.push(data_inicio); }
    if (data_fim)    { where += ' AND data <= ?'; params.push(data_fim); }
    if (projeto_id)  { where += ' AND projeto_id = ?'; params.push(projeto_id); }
    if (produtor_id) { where += ' AND produtor_id = ?'; params.push(produtor_id); }

    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total_registros,
        SUM(qtd_arrobas) AS total_arrobas,
        SUM(sacas) AS total_sacas,
        SUM(qtd_arrobas * 15) AS total_kg,
        SUM(lucro_kg * qtd_arrobas * 15) AS lucro_total
      FROM producao_cacau ${where}
    `, params);
    return rows[0];
  },
};

module.exports = producaoCacauRepository;
