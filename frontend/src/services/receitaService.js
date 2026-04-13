import api from '../config/api';
import { makeService } from './makeService';

const base = makeService('/receitas');

export default {
  ...base,
  lancarReceitaVenda: (data) => api.post('/receitas/lancar-venda', data).then(r => r.data),
};
