import api from '../config/api';

const producaoCacauService = {
  getAll:    (params) => api.get('/producao-cacau', { params }).then(r => r.data),
  getById:   (id)     => api.get(`/producao-cacau/${id}`).then(r => r.data),
  getTotais: (params) => api.get('/producao-cacau/totais', { params }).then(r => r.data),
  create:    (data)   => api.post('/producao-cacau', data).then(r => r.data),
  update:    (id, data) => api.put(`/producao-cacau/${id}`, data).then(r => r.data),
  remove:    (id)     => api.delete(`/producao-cacau/${id}`).then(r => r.data),
};

export default producaoCacauService;
