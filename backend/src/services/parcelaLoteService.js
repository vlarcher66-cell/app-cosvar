const parcelaRepo  = require('../repositories/parcelaLoteRepository');
const contratoRepo = require('../repositories/contratoLoteRepository');
const db           = require('../config/database');

const findByContrato = (contrato_id)           => parcelaRepo.findByContrato(contrato_id);
const findVencidas   = (usuario_id)            => parcelaRepo.findVencidas(usuario_id);
const findByMes      = (usuario_id, mes, ano)  => parcelaRepo.findByMes(usuario_id, mes, ano);

/**
 * Baixa parcela, lança receita + receita_pagamento (múltiplas formas) e verifica quitação
 */
const baixar = async (id, dados, usuario_id) => {
  const { data_pagamento, observacao } = dados;

  // Aceita array de pagamentos (novo) ou formato legado
  const pagamentos = Array.isArray(dados.pagamentos) && dados.pagamentos.length > 0
    ? dados.pagamentos
    : [{ conta_id: dados.conta_id, forma_pagamento_id: dados.forma_pagamento_id || null, valor: null }];

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const primeiroPag = pagamentos[0];
    await parcelaRepo.baixar(id, {
      data_pagamento,
      conta_id: primeiroPag.conta_id,
      forma_pagamento_id: primeiroPag.forma_pagamento_id || null,
      observacao,
    }, usuario_id);

    // Busca dados da parcela
    const [[parcela]] = await conn.query(
      `SELECT pl.*, c.lote_id, c.cliente_imovel_id,
         ci.nome AS comprador_nome,
         l.numero AS lote_numero, q.nome AS quadra_nome, e.nome AS empreendimento_nome
       FROM parcela_lote pl
       JOIN contrato_lote c ON c.id = pl.contrato_id
       JOIN lote l ON l.id = c.lote_id
       JOIN quadra q ON q.id = l.quadra_id
       JOIN empreendimento e ON e.id = q.empreendimento_id
       LEFT JOIN cliente_imovel ci ON ci.id = c.cliente_imovel_id
       WHERE pl.id = ?`, [id]
    );

    if (parcela) {
      // Garante categoria e descrição
      let [[cat]] = await conn.query(
        `SELECT id FROM categoria_receita WHERE nome = 'Imóvel' AND tipo = 'Venda' AND usuario_id = ? LIMIT 1`,
        [usuario_id]
      );
      if (!cat) {
        const [res] = await conn.query(
          `INSERT INTO categoria_receita (nome, tipo, usuario_id) VALUES ('Imóvel', 'Venda', ?)`, [usuario_id]
        );
        cat = { id: res.insertId };
      }
      let [[desc]] = await conn.query(
        `SELECT id FROM descricao_receita WHERE nome = 'Venda de Lote' AND categoria_id = ? LIMIT 1`, [cat.id]
      );
      if (!desc) {
        const [res] = await conn.query(
          `INSERT INTO descricao_receita (nome, categoria_id, usuario_id) VALUES ('Venda de Lote', ?, ?)`,
          [cat.id, usuario_id]
        );
        desc = { id: res.insertId };
      }

      const label = parcela.numero === 0 ? 'Entrada' : `Parcela ${parcela.numero}`;
      const descricao = `${label} — Lote ${parcela.lote_numero} Qd.${parcela.quadra_nome} (${parcela.empreendimento_nome})${parcela.comprador_nome ? ' — ' + parcela.comprador_nome : ''}`;
      const valorTotal = pagamentos.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0) || Number(parcela.valor);

      // Receita principal
      const [recRes] = await conn.query(
        `INSERT INTO receita (categoria_id, descricao_id, descricao, valor, data, status, conta_id, forma_pagamento_id, usuario_id)
         VALUES (?, ?, ?, ?, ?, 'recebido', ?, ?, ?)`,
        [cat.id, desc.id, descricao, valorTotal, data_pagamento,
         primeiroPag.conta_id || null, primeiroPag.forma_pagamento_id || null, usuario_id]
      );
      const receitaId = recRes.insertId;

      // Receita pagamento por forma
      for (const p of pagamentos) {
        const valorPag = parseFloat(p.valor) || valorTotal;
        await conn.query(
          `INSERT INTO receita_pagamento (receita_id, conta_id, forma_pagamento_id, valor) VALUES (?, ?, ?, ?)`,
          [receitaId, p.conta_id || null, p.forma_pagamento_id || null, valorPag]
        );
      }

      // Verifica quitação
      const [[resumo]] = await conn.query(
        `SELECT COUNT(*) AS total, SUM(status = 'pago') AS pagas FROM parcela_lote WHERE contrato_id = ?`,
        [parcela.contrato_id]
      );
      if (Number(resumo.total) === Number(resumo.pagas)) {
        await conn.query(`UPDATE contrato_lote SET status='quitado' WHERE id=?`, [parcela.contrato_id]);
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const estornar = (id, usuario_id) => parcelaRepo.estornar(id, usuario_id);

module.exports = { findByContrato, findVencidas, findByMes, baixar, estornar };
