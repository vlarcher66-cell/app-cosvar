const service = require('../services/cacauOrdemService');

const cacauOrdemController = {
  async index(req, res) {
    try {
      const data = await service.getAll(req.query);
      res.json(data);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },

  async show(req, res) {
    try {
      const data = await service.getById(req.params.id);
      res.json(data);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },

  async store(req, res) {
    try {
      const data = await service.create(req.body, req.user.id);
      res.status(201).json(data);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },

  async update(req, res) {
    try {
      const data = await service.update(req.params.id, req.body);
      res.json(data);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },

  async destroy(req, res) {
    try {
      await service.remove(req.params.id);
      res.json({ message: 'Excluído com sucesso' });
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },

  async resumo(req, res) {
    try {
      const data = await service.getResumo(req.query);
      res.json(data);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },

  async saldoDisponivel(req, res) {
    try {
      const data = await service.saldoDisponivel(req.params.credora, req.query.ano);
      res.json(data);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
};

module.exports = cacauOrdemController;
