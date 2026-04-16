import api from '../config/api';

export default {
  getAll:    ()   => api.get('/empreendimentos').then(r => r.data.data),
  getOne:    (id) => api.get(`/empreendimentos/${id}`).then(r => r.data.data),
  getLotes:  (id) => api.get(`/empreendimentos/${id}/lotes`).then(r => r.data.data),
  create:    (d)  => api.post('/empreendimentos', d).then(r => r.data),
  update:    (id, d) => api.put(`/empreendimentos/${id}`, d).then(r => r.data),
  remove:    (id) => api.delete(`/empreendimentos/${id}`).then(r => r.data),
};
