const repo = require('../repositories/producaoCacauRepository');

const producaoCacauService = {
  async getAll(filters) {
    return repo.findAll(filters);
  },

  async getById(id) {
    const item = await repo.findById(id);
    if (!item) throw { status: 404, message: 'Registro não encontrado' };
    return item;
  },

  async create(data, usuarioId) {
    if (!data.data)        throw { status: 400, message: 'Data é obrigatória' };
    if (!data.projeto_id)  throw { status: 400, message: 'Projeto é obrigatório' };
    if (!data.produtor_id) throw { status: 400, message: 'Produtor é obrigatório' };
    if (!data.producao)    throw { status: 400, message: 'Descrição da produção é obrigatória' };
    if (!data.qtd_arrobas) throw { status: 400, message: 'Quantidade em arrobas é obrigatória' };
    return repo.create({ ...data, usuario_id: usuarioId });
  },

  async update(id, data) {
    await this.getById(id);
    return repo.update(id, data);
  },

  async remove(id) {
    await this.getById(id);
    return repo.remove(id);
  },

  async getTotais(filters) {
    return repo.totais(filters);
  },
};

module.exports = producaoCacauService;
