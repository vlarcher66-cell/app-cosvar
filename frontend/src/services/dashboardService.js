import api from '../config/api';
export default {
  getResumo: (params) => api.get('/dashboard/resumo', { params }).then(r => r.data.data),
};
