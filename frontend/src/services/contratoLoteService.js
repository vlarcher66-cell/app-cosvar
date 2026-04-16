import api from '../config/api';

export default {
  getAll:     (params) => api.get('/contratos-lote', { params }).then(r => r.data.data),
  getOne:     (id) => api.get(`/contratos-lote/${id}`).then(r => r.data.data),
  create:     (d)  => api.post('/contratos-lote', d).then(r => r.data),
  update:     (id, d) => api.put(`/contratos-lote/${id}`, d).then(r => r.data),
  rescindir:  (id) => api.patch(`/contratos-lote/${id}/rescindir`).then(r => r.data),
  remove:     (id) => api.delete(`/contratos-lote/${id}`).then(r => r.data),
};
