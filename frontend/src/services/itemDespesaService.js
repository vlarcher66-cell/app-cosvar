import api from '../config/api';
import { makeService } from './makeService';

const base = makeService('/itens-despesa');

export default {
  ...base,
  getAll: () => api.get('/itens-despesa').then(r => r.data.data ?? r.data),
  getBySubgrupo: (subgrupo_id) => api.get(`/itens-despesa/por-subgrupo/${subgrupo_id}`).then(r => r.data.data),
};
