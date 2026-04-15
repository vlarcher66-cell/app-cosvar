const repo      = require('../repositories/cacauBaixaRepository');
const receitaRepo = require('../repositories/receitaRepository');
const db        = require('../config/database');

const cacauBaixaService = {
  async getAll(filters)  { return repo.findAll(filters); },
  async getById(id) {
    const item = await repo.findById(id);
    if (!item) throw { status: 404, message: 'Baixa não encontrada' };
    return item;
  },
  async create(data, usuarioId) {
    if (!data.data)    throw { status: 400, message: 'Data é obrigatória' };
    if (!data.credora) throw { status: 400, message: 'Credora é obrigatória' };
    if (!data.kg || parseFloat(data.kg) <= 0) throw { status: 400, message: 'KG deve ser maior que zero' };
    const qtd_arrobas = (parseFloat(data.kg) / 15).toFixed(3);

    const [rows] = await require('../config/database').query('SELECT COUNT(*)+1 AS prox FROM cacau_baixa');
    const seq = String(rows[0].prox).padStart(4, '0');
    const ym  = new Date().toISOString().slice(0, 7).replace('-', '');
    const numero_ordem = `VND-${ym}-${seq}`;

    return repo.create({ ...data, qtd_arrobas, numero_ordem, usuario_id: usuarioId });
  },
  async update(id, data) {
    await this.getById(id);
    if (data.kg) data.qtd_arrobas = (parseFloat(data.kg) / 15).toFixed(3);
    return repo.update(id, data);
  },
  async remove(id)           { await this.getById(id); return repo.remove(id); },

  // Cria venda + lança receitas (uma por parcela de pagamento) numa única transação
  async vendaCompleta(data, usuarioId) {
    if (!data.data)         throw { status: 400, message: 'Data é obrigatória' };
    if (!data.comprador_id) throw { status: 400, message: 'Credora é obrigatória' };
    if (!data.kg || parseFloat(data.kg) <= 0) throw { status: 400, message: 'KG deve ser maior que zero' };

    // Normaliza parcelas — aceita array novo ou formato legado {conta_id, forma_pagamento_id}
    const parcelas = Array.isArray(data.parcelas) && data.parcelas.length > 0
      ? data.parcelas
      : [{ conta_id: data.conta_id, forma_pagamento_id: data.forma_pagamento_id || null, valor: data.valor_total }];

    if (!parcelas.every(p => p.conta_id)) throw { status: 400, message: 'Todas as parcelas precisam de conta de recebimento' };
    if (!parcelas.every(p => parseFloat(p.valor) > 0)) throw { status: 400, message: 'Todas as parcelas precisam ter valor maior que zero' };

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Gera número de ordem
      const [[seq]] = await conn.query('SELECT COUNT(*)+1 AS prox FROM cacau_baixa');
      const numero  = String(seq.prox).padStart(4, '0');
      const ym      = new Date().toISOString().slice(0, 7).replace('-', '');
      const numero_ordem = `VND-${ym}-${numero}`;
      const qtd_arrobas  = (parseFloat(data.kg) / 15).toFixed(3);

      // 2. Insere a baixa
      const [baixaResult] = await conn.query(
        `INSERT INTO cacau_baixa (numero_ordem, data, comprador_id, kg, qtd_arrobas, preco_arroba, valor_total, observacao, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [numero_ordem, data.data, data.comprador_id, data.kg, qtd_arrobas,
         data.preco_arroba || null, data.valor_total || null,
         data.observacao || null, usuarioId]
      );
      const baixaId = baixaResult.insertId;

      // 3. Busca categoria e descrição
      const [[cat]] = await conn.query(
        `SELECT id FROM categoria_receita WHERE nome = 'Cacau' AND tipo = 'Venda' LIMIT 1`
      );
      if (!cat) throw { status: 500, message: 'Categoria "Cacau / Venda" não encontrada. Configure no cadastro.' };

      const [[desc]] = await conn.query(
        `SELECT id FROM descricao_receita WHERE nome = 'Venda de Cacau' AND categoria_id = ? LIMIT 1`,
        [cat.id]
      );
      if (!desc) throw { status: 500, message: 'Descrição "Venda de Cacau" não encontrada. Configure no cadastro.' };

      // 4. Insere uma receita por parcela
      for (const p of parcelas) {
        const observacao = `Venda de cacau — ${numero_ordem}${parcelas.length > 1 ? ` (parcela)` : ''}`;
        await conn.query(
          `INSERT INTO receita (categoria_id, descricao_id, projeto_id, conta_id, forma_pagamento_id, cacau_baixa_id, valor, data, descricao, status, usuario_id)
           VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 'recebido', ?)`,
          [cat.id, desc.id, p.conta_id, p.forma_pagamento_id || null,
           baixaId, p.valor, data.data, observacao, usuarioId]
        );
      }

      await conn.commit();
      const [rows] = await db.query('SELECT * FROM cacau_baixa WHERE id = ?', [baixaId]);
      return rows[0];
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
  async saldoPorCredora(f)   { return repo.saldoPorCredora(f); },
  async saldoCredora(credora){ return repo.saldoCredora(credora); },
  async resumoGeral(f)       { return repo.resumoGeral(f); },
  async saldoFinanceiro(f)   { return repo.saldoFinanceiro(f); },
  async vendasPorMes(f)      { return repo.vendasPorMes(f); },
  async anosDisponiveis()    { return repo.anosDisponiveis(); },
};

module.exports = cacauBaixaService;
