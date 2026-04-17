import api from '../config/api';

export default {
  getAll:  ()       => api.get('/clientes-imovel').then(r => r.data.data),
  getOne:  (id)     => api.get(`/clientes-imovel/${id}`).then(r => r.data.data),
  create:  (d)      => api.post('/clientes-imovel', d).then(r => r.data),
  update:  (id, d)  => api.put(`/clientes-imovel/${id}`, d).then(r => r.data),
  remove:  (id)     => api.delete(`/clientes-imovel/${id}`).then(r => r.data),
};
