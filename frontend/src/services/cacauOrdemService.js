import api from '../config/api';

const cacauOrdemService = {
  getAll:    (params) => api.get('/cacau-ordem', { params }).then(r => r.data),
  getById:   (id)     => api.get(`/cacau-ordem/${id}`).then(r => r.data),
  getResumo: (params) => api.get('/cacau-ordem/resumo', { params }).then(r => r.data),
  getSaldoDisponivel: (credora, ano) => api.get(`/cacau-ordem/saldo/${encodeURIComponent(credora)}`, { params: ano ? { ano } : {} }).then(r => r.data),
  create:    (data)   => api.post('/cacau-ordem', data).then(r => r.data),
  update:    (id, data) => api.put(`/cacau-ordem/${id}`, data).then(r => r.data),
  remove:    (id)     => api.delete(`/cacau-ordem/${id}`).then(r => r.data),
};

export default cacauOrdemService;
