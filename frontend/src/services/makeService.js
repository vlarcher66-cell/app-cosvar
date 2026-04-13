import api from '../config/api';

/**
 * Factory de service para CRUDs padrão
 */
export const makeService = (endpoint) => ({
  getAll:  (params) => api.get(endpoint, { params }).then(r => r.data.data),
  getOne:  (id)     => api.get(`${endpoint}/${id}`).then(r => r.data.data),
  create:  (data)   => api.post(endpoint, data).then(r => r.data.data),
  update:  (id, data) => api.put(`${endpoint}/${id}`, data).then(r => r.data.data),
  remove:  (id)     => api.delete(`${endpoint}/${id}`).then(r => r.data),
});
