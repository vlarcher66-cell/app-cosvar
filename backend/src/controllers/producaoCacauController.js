const service = require('../services/producaoCacauService');

const producaoCacauController = {
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

  async totais(req, res) {
    try {
      const data = await service.getTotais(req.query);
      res.json(data);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
};

module.exports = producaoCacauController;
