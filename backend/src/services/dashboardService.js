const despesaRepo = require('../repositories/despesaRepository');
const receitaRepo = require('../repositories/receitaRepository');

const getResumo = async (usuario_id, mes, ano) => {
  const [despPorStatus, recPorStatus, despPorGrupo] = await Promise.all([
    despesaRepo.totaisPorStatus(usuario_id, mes, ano),
    receitaRepo.totaisPorStatus(usuario_id, mes, ano),
    despesaRepo.totaisPorGrupo(usuario_id, mes, ano),
  ]);

  const totalDespesas = despPorStatus.reduce((s, r) => s + parseFloat(r.total || 0), 0);
  const totalReceitas = recPorStatus.reduce((s, r) => s + parseFloat(r.total || 0), 0);
  const saldo = totalReceitas - totalDespesas;

  const despPagas = despPorStatus.find(r => r.status === 'pago')?.total || 0;
  const despPendentes = despPorStatus.find(r => r.status === 'pendente')?.total || 0;
  const recRecebidas = recPorStatus.find(r => r.status === 'recebido')?.total || 0;
  const recPendentes = recPorStatus.find(r => r.status === 'pendente')?.total || 0;

  return {
    totalDespesas,
    totalReceitas,
    saldo,
    despPagas: parseFloat(despPagas),
    despPendentes: parseFloat(despPendentes),
    recRecebidas: parseFloat(recRecebidas),
    recPendentes: parseFloat(recPendentes),
    despPorGrupo,
    mes,
    ano,
  };
};

module.exports = { getResumo };
