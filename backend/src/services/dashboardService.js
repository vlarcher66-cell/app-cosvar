const despesaRepo = require('../repositories/despesaRepository');
const receitaRepo = require('../repositories/receitaRepository');
const db = require('../config/database');

const getResumo = async (usuario_id, mes, ano) => {
  const [despPorStatus, recPorStatus, despPorGrupo] = await Promise.all([
    despesaRepo.totaisPorStatus(usuario_id, mes, ano),
    receitaRepo.totaisPorStatus(usuario_id, mes, ano),
    despesaRepo.totaisPorGrupo(usuario_id, mes, ano),
  ]);

  const totalDespesas  = despPorStatus.reduce((s, r) => s + parseFloat(r.total || 0), 0);
  const totalReceitas  = recPorStatus.reduce((s, r) => s + parseFloat(r.total || 0), 0);
  const saldo          = totalReceitas - totalDespesas;
  const despPagas      = despPorStatus.find(r => r.status === 'pago')?.total || 0;
  const despPendentes  = despPorStatus.find(r => r.status === 'pendente')?.total || 0;
  const recRecebidas   = recPorStatus.find(r => r.status === 'recebido')?.total || 0;
  const recPendentes   = recPorStatus.find(r => r.status === 'pendente')?.total || 0;

  // Evolução mensal receitas vs despesas — todos os 12 meses do ano
  const [evolucaoRaw] = await db.query(`
    SELECT
      n.mes,
      COALESCE(SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END),0) AS receitas,
      COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END),0) AS despesas
    FROM (
      SELECT 1 AS mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
      UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
      UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
    ) n
    LEFT JOIN (
      SELECT MONTH(data) AS mes, valor, 'receita' AS tipo FROM receita WHERE usuario_id = ? AND YEAR(data) = ?
      UNION ALL
      SELECT MONTH(data) AS mes, valor, 'despesa' AS tipo FROM despesa WHERE usuario_id = ? AND YEAR(data) = ?
    ) m ON m.mes = n.mes
    GROUP BY n.mes
    ORDER BY n.mes
  `, [usuario_id, ano, usuario_id, ano]);
  console.log('[dashboard] evolucaoRaw:', JSON.stringify(evolucaoRaw));
  const evolucao = evolucaoRaw.map(r => ({ mes: Number(r.mes), receitas: parseFloat(r.receitas||0), despesas: parseFloat(r.despesas||0) }));

  // Cacau: vendas por mês no ano — todos os 12 meses
  const [cacauVendasRaw] = await db.query(`
    SELECT n.mes, COALESCE(SUM(b.valor_total),0) AS total, COALESCE(SUM(b.kg),0) AS kg, COALESCE(SUM(b.qtd_arrobas),0) AS arrobas
    FROM (SELECT 1 AS mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) n
    LEFT JOIN cacau_baixa b ON MONTH(b.data) = n.mes AND YEAR(b.data) = ?
    GROUP BY n.mes ORDER BY n.mes
  `, [ano]);
  const cacauVendas = cacauVendasRaw.map(r => ({ mes: Number(r.mes), total: parseFloat(r.total||0), kg: parseFloat(r.kg||0), arrobas: parseFloat(r.arrobas||0) }));

  // Cacau: totais gerais
  const [[cacauTotais]] = await db.query(`
    SELECT
      COALESCE(SUM(valor_total),0) AS total_vendido,
      COALESCE(SUM(kg),0) AS total_kg,
      COALESCE(SUM(qtd_arrobas),0) AS total_arrobas
    FROM cacau_baixa WHERE YEAR(data) = ?
  `, [ano]);

  // Cacau: saldo por credora
  const [cacauSaldo] = await db.query(`
    SELECT c.nome AS credora,
      COALESCE(o.kg_total,0) AS kg_entregue,
      COALESCE(b.kg_total,0) AS kg_baixado,
      COALESCE(o.kg_total,0) - COALESCE(b.kg_total,0) AS saldo_kg
    FROM comprador c
    LEFT JOIN (SELECT comprador_id, SUM(kg) AS kg_total FROM cacau_ordem WHERE comprador_id IS NOT NULL GROUP BY comprador_id) o ON o.comprador_id = c.id
    LEFT JOIN (SELECT comprador_id, SUM(kg) AS kg_total FROM cacau_baixa WHERE comprador_id IS NOT NULL GROUP BY comprador_id) b ON b.comprador_id = c.id
    WHERE (o.kg_total > 0 OR b.kg_total > 0)
    ORDER BY saldo_kg DESC
  `);

  // Imóveis: contratos
  const [[contratosResumo]] = await db.query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status='ativo' THEN 1 ELSE 0 END) AS ativos,
      SUM(CASE WHEN status='quitado' THEN 1 ELSE 0 END) AS quitados,
      SUM(CASE WHEN status='rescindido' THEN 1 ELSE 0 END) AS rescindidos,
      COALESCE(SUM(valor_total),0) AS valor_total_contratado
    FROM contrato_lote WHERE usuario_id = ?
  `, [usuario_id]);

  // Imóveis: parcelas
  const [[parcelasResumo]] = await db.query(`
    SELECT
      COALESCE(SUM(CASE WHEN pl.status='pago' THEN pl.valor ELSE 0 END),0) AS total_recebido,
      COALESCE(SUM(CASE WHEN pl.status='pendente' THEN pl.valor ELSE 0 END),0) AS total_pendente,
      COALESCE(SUM(CASE WHEN pl.status='vencido' THEN pl.valor ELSE 0 END),0) AS total_vencido,
      COUNT(CASE WHEN pl.status='vencido' THEN 1 END) AS qtd_vencidas
    FROM parcela_lote pl
    JOIN contrato_lote c ON c.id = pl.contrato_id
    WHERE c.usuario_id = ?
  `, [usuario_id]);

  // Imóveis: recebimentos por mês no ano — todos os 12 meses
  const [parcelasPorMesRaw] = await db.query(`
    SELECT n.mes, COALESCE(SUM(pl.valor),0) AS total
    FROM (SELECT 1 AS mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) n
    LEFT JOIN parcela_lote pl ON MONTH(pl.data_pagamento) = n.mes AND YEAR(pl.data_pagamento) = ? AND pl.status='pago'
    LEFT JOIN contrato_lote c ON c.id = pl.contrato_id AND c.usuario_id = ?
    GROUP BY n.mes ORDER BY n.mes
  `, [ano, usuario_id]);
  const parcelasPorMes = parcelasPorMesRaw.map(r => ({ mes: Number(r.mes), total: parseFloat(r.total||0) }));

  // Lotes por status
  const [lotesPorStatus] = await db.query(`
    SELECT l.status, COUNT(*) AS qtd
    FROM lote l
    JOIN quadra q ON q.id = l.quadra_id
    JOIN empreendimento e ON e.id = q.empreendimento_id
    WHERE e.usuario_id = ?
    GROUP BY l.status
  `, [usuario_id]);

  // Alertas: parcelas vencidas há mais de 30 dias
  const [alertasVencidas] = await db.query(`
    SELECT pl.id, pl.valor, pl.data_vencimento,
      ci.nome AS cliente, e.nome AS empreendimento,
      DATEDIFF(CURDATE(), pl.data_vencimento) AS dias_atraso
    FROM parcela_lote pl
    JOIN contrato_lote c ON c.id = pl.contrato_id
    JOIN empreendimento e ON e.id = (SELECT q2.empreendimento_id FROM lote l2 JOIN quadra q2 ON q2.id=l2.quadra_id WHERE l2.id=c.lote_id LIMIT 1)
    LEFT JOIN cliente_imovel ci ON ci.id = c.cliente_imovel_id
    WHERE c.usuario_id = ? AND pl.status='vencido' AND pl.data_vencimento < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ORDER BY dias_atraso DESC LIMIT 5
  `, [usuario_id]);

  // Receitas por categoria no mês
  console.log('[dashboard] recPorStatus:', JSON.stringify(recPorStatus));
  const [receitasPorCategoria] = await db.query(`
    SELECT cr.nome AS categoria, SUM(r.valor) AS total
    FROM receita r
    LEFT JOIN categoria_receita cr ON cr.id = r.categoria_id
    WHERE r.usuario_id = ? AND MONTH(r.data) = ? AND YEAR(r.data) = ?
    GROUP BY cr.nome
    ORDER BY total DESC
  `, [usuario_id, mes, ano]);

  return {
    totalDespesas, totalReceitas, saldo,
    despPagas: parseFloat(despPagas),
    despPendentes: parseFloat(despPendentes),
    recRecebidas: parseFloat(recRecebidas),
    recPendentes: parseFloat(recPendentes),
    despPorGrupo,
    mes, ano,
    evolucao,
    cacau: { vendas: cacauVendas, totais: cacauTotais, saldo: cacauSaldo },
    imoveis: {
      contratos: contratosResumo,
      parcelas: parcelasResumo,
      recebimentosPorMes: parcelasPorMes,
      lotesPorStatus,
    },
    alertas: { parcelasVencidas: alertasVencidas },
    receitasPorCategoria,
  };
};

module.exports = { getResumo };
