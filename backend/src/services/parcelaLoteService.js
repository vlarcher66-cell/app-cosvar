const parcelaRepo  = require('../repositories/parcelaLoteRepository');
const contratoRepo = require('../repositories/contratoLoteRepository');
const db           = require('../config/database');

const findByContrato = (contrato_id)           => parcelaRepo.findByContrato(contrato_id);
const findVencidas   = (usuario_id)            => parcelaRepo.findVencidas(usuario_id);
const findByMes      = (usuario_id, mes, ano)  => parcelaRepo.findByMes(usuario_id, mes, ano);

/**
 * Baixa parcela e lança receita automaticamente
 */
const baixar = async (id, dados, usuario_id) => {
  const { data_pagamento, conta_id, forma_pagamento_id, observacao } = dados;

  await parcelaRepo.baixar(id, { data_pagamento, conta_id, forma_pagamento_id, observacao }, usuario_id);

  // Busca dados da parcela para montar a receita
  const [[parcela]] = await db.query(
    `SELECT pl.*, c.comprador_id, c.lote_id,
       comp.nome_razao AS comprador_nome,
       l.numero AS lote_numero, q.nome AS quadra_nome, e.nome AS empreendimento_nome
     FROM parcela_lote pl
     JOIN contrato_lote c ON c.id = pl.contrato_id
     JOIN lote l ON l.id = c.lote_id
     JOIN quadra q ON q.id = l.quadra_id
     JOIN empreendimento e ON e.id = q.empreendimento_id
     JOIN comprador comp ON comp.id = c.comprador_id
     WHERE pl.id = ?`, [id]
  );

  if (parcela) {
    // Busca ou cria categoria "Imóvel / Venda de Lote"
    let [[cat]] = await db.query(
      `SELECT id FROM categoria_receita WHERE nome = 'Imóvel' AND tipo = 'Venda' AND usuario_id = ? LIMIT 1`,
      [usuario_id]
    );
    if (!cat) {
      const [res] = await db.query(
        `INSERT INTO categoria_receita (nome, tipo, usuario_id) VALUES ('Imóvel', 'Venda', ?)`,
        [usuario_id]
      );
      cat = { id: res.insertId };
    }

    let [[desc]] = await db.query(
      `SELECT id FROM descricao_receita WHERE nome = 'Venda de Lote' AND categoria_id = ? LIMIT 1`,
      [cat.id]
    );
    if (!desc) {
      const [res] = await db.query(
        `INSERT INTO descricao_receita (nome, categoria_id, usuario_id) VALUES ('Venda de Lote', ?, ?)`,
        [cat.id, usuario_id]
      );
      desc = { id: res.insertId };
    }

    const descricao = `Parcela ${parcela.numero} — Lote ${parcela.lote_numero} Qd.${parcela.quadra_nome} (${parcela.empreendimento_nome}) — ${parcela.comprador_nome}`;

    await db.query(
      `INSERT INTO receita
         (categoria_id, descricao_id, descricao, valor, data, status, conta_id, forma_pagamento_id, usuario_id)
       VALUES (?, ?, ?, ?, ?, 'recebido', ?, ?, ?)`,
      [cat.id, desc.id, descricao, parcela.valor, data_pagamento,
       conta_id || null, forma_pagamento_id || null, usuario_id]
    );
  }

  // Verifica se o contrato foi quitado
  const [[resumo]] = await db.query(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'pago') AS pagas
     FROM parcela_lote WHERE contrato_id = ?`,
    [parcela.contrato_id]
  );
  if (resumo.total === resumo.pagas) {
    await db.query(
      `UPDATE contrato_lote SET status='quitado' WHERE id=?`,
      [parcela.contrato_id]
    );
  }
};

const estornar = (id, usuario_id) => parcelaRepo.estornar(id, usuario_id);

module.exports = { findByContrato, findVencidas, findByMes, baixar, estornar };
