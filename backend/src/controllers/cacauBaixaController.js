const service = require('../services/cacauBaixaService');

const cacauBaixaController = {
  async index(req, res) {
    try { res.json(await service.getAll(req.query)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
  async store(req, res) {
    try { res.status(201).json(await service.create(req.body, req.user.id)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
  async update(req, res) {
    try { res.json(await service.update(req.params.id, req.body)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
  async destroy(req, res) {
    try { await service.remove(req.params.id); res.json({ message: 'Excluído' }); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
  async saldo(req, res) {
    try { res.json(await service.saldoPorCredora(req.query)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
  async saldoCredora(req, res) {
    try { res.json(await service.saldoCredora(req.params.credora)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
  async resumo(req, res) {
    try { res.json(await service.resumoGeral(req.query)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
  async saldoFinanceiro(req, res) {
    try { res.json(await service.saldoFinanceiro(req.query)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
  async vendasPorMes(req, res) {
    try { res.json(await service.vendasPorMes(req.query)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
  async anosDisponiveis(req, res) {
    try { res.json(await service.anosDisponiveis()); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  },
};

module.exports = cacauBaixaController;
