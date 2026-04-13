const repo = require('../repositories/cacauBaixaRepository');

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
  async saldoPorCredora(f)   { return repo.saldoPorCredora(f); },
  async saldoCredora(credora){ return repo.saldoCredora(credora); },
  async resumoGeral(f)       { return repo.resumoGeral(f); },
  async saldoFinanceiro(f)   { return repo.saldoFinanceiro(f); },
  async vendasPorMes(f)      { return repo.vendasPorMes(f); },
  async anosDisponiveis()    { return repo.anosDisponiveis(); },
};

module.exports = cacauBaixaService;
