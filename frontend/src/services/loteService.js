import api from '../config/api';

export default {
  getOne:     (id) => api.get(`/lotes/${id}`).then(r => r.data.data),
  create:     (d)  => api.post('/lotes', d).then(r => r.data),
  createBulk: (lotes) => api.post('/lotes/bulk', { lotes }).then(r => r.data),
  update:     (id, d) => api.put(`/lotes/${id}`, d).then(r => r.data),
  remove:     (id) => api.delete(`/lotes/${id}`).then(r => r.data),
};
