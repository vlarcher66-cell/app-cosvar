import api from '../config/api';
import { makeService } from './makeService';

const base = makeService('/subgrupos-despesa');

export default {
  ...base,
  getByGrupo: (grupo_id) => api.get(`/subgrupos-despesa/por-grupo/${grupo_id}`).then(r => r.data.data),
};
