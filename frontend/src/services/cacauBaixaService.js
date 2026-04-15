import api from '../config/api';

const cacauBaixaService = {
  getAll:        (params) => api.get('/cacau-baixa', { params }).then(r => r.data),
  create:        (data)   => api.post('/cacau-baixa', data).then(r => r.data),
  vendaCompleta: (data)   => api.post('/cacau-baixa/venda-completa', data).then(r => r.data),
  update:   (id, data) => api.put(`/cacau-baixa/${id}`, data).then(r => r.data),
  remove:   (id)     => api.delete(`/cacau-baixa/${id}`).then(r => r.data),
  getSaldo: (params)          => api.get('/cacau-baixa/saldo', { params }).then(r => r.data),
  getSaldoCredora: (credora) => api.get(`/cacau-baixa/saldo/${encodeURIComponent(credora)}`).then(r => r.data),
  getResumo: ()           => api.get('/cacau-baixa/resumo').then(r => r.data),
  getSaldoFinanceiro: ()  => api.get('/cacau-baixa/saldo-financeiro').then(r => r.data),
  getVendasPorMes:    ()  => api.get('/cacau-baixa/vendas-por-mes').then(r => r.data),
  getAnos:            ()  => api.get('/cacau-baixa/anos').then(r => r.data),
};

export default cacauBaixaService;
