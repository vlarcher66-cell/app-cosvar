import api from '../config/api';
import { makeService } from './makeService';

const base = makeService('/descricoes-receita');

export default {
  ...base,
  getByCategoria: (categoria_id) => api.get(`/descricoes-receita/por-categoria/${categoria_id}`).then(r => r.data.data),
};
