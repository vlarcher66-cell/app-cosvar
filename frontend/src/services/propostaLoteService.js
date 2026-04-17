import api from '../config/api';

export default {
  getAll:      ()          => api.get('/propostas-lote').then(r => r.data.data),
  getOne:      (id)        => api.get(`/propostas-lote/${id}`).then(r => r.data.data),
  getByLote:   (lote_id)   => api.get(`/propostas-lote/lote/${lote_id}`).then(r => r.data.data),
  create:      (data)      => api.post('/propostas-lote', data).then(r => r.data),
  aprovar:     (id, data)  => api.post(`/propostas-lote/${id}/aprovar`, data).then(r => r.data),
  recusar:     (id)        => api.post(`/propostas-lote/${id}/recusar`).then(r => r.data),
  remove:      (id)        => api.delete(`/propostas-lote/${id}`).then(r => r.data),
};
