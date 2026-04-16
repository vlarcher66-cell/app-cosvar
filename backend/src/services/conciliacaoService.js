const repo = require('../repositories/conciliacaoRepository');

const getMovimentos = async (usuario_id, conta_id, mes, ano) => {
  if (!conta_id) throw { statusCode: 400, message: 'Conta é obrigatória' };
  if (!mes || !ano) throw { statusCode: 400, message: 'Mês e ano são obrigatórios' };
  const movimentos   = await repo.getMovimentos(usuario_id, conta_id, mes, ano);
  const saldo_inicial = await repo.getSaldoInicial(conta_id, usuario_id);
  return { saldo_inicial, movimentos };
};

const setConciliado = (usuario_id, tipo, id, conciliado, receita_id) => {
  if (!['receita', 'despesa'].includes(tipo)) throw { statusCode: 400, message: 'Tipo inválido' };
  return repo.setConciliado(tipo, id, conciliado, usuario_id, receita_id);
};

module.exports = { getMovimentos, setConciliado };
