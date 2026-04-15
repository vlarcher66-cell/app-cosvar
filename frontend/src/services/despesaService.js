import api from '../config/api';
import { makeService } from './makeService';

const base = makeService('/despesas');

export default {
  ...base,
  createBatch: (payload) => api.post('/despesas/batch', payload).then(r => r.data),
  baixar: (id, payload) => api.patch(`/despesas/${id}/baixa`, payload).then(r => r.data),
};
