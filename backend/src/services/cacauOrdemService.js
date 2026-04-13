const repo = require('../repositories/cacauOrdemRepository');

const cacauOrdemService = {
  async getAll(filters) {
    return repo.findAll(filters);
  },

  async getById(id) {
    const item = await repo.findById(id);
    if (!item) throw { status: 404, message: 'Ordem não encontrada' };
    return item;
  },

  async create(data, usuarioId) {
    if (!data.data)    throw { status: 400, message: 'Data é obrigatória' };
    if (!data.kg)      throw { status: 400, message: 'KG é obrigatório' };
    if (!data.credora) throw { status: 400, message: 'Credora é obrigatória' };

    // Calcula QTD @ a partir do KG (1 @ = 15 kg)
    const qtd_arrobas = (parseFloat(data.kg) / 15).toFixed(3);

    // Gera número da ordem automático: ORD-YYYYMM-XXXX
    const [rows] = await require('../config/database').query('SELECT COUNT(*)+1 AS prox FROM cacau_ordem');
    const seq = String(rows[0].prox).padStart(4, '0');
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const numero_ordem = `ORD-${ym}-${seq}`;

    return repo.create({ ...data, qtd_arrobas, numero_ordem, usuario_id: usuarioId });
  },

  async update(id, data) {
    await this.getById(id);
    // Recalcula QTD @ a partir do KG
    if (data.kg) {
      data.qtd_arrobas = (parseFloat(data.kg) / 15).toFixed(3);
    }
    return repo.update(id, data);
  },

  async remove(id) {
    await this.getById(id);
    return repo.remove(id);
  },

  async getResumo(filters) {
    return repo.resumo(filters);
  },

  async saldoDisponivel(credora, ano) {
    if (!credora) throw { status: 400, message: 'Credora é obrigatória' };
    return repo.saldoDisponivel(credora, ano);
  },
};

module.exports = cacauOrdemService;
