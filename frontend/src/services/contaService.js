import api from '../config/api';
import { makeService } from './makeService';

const base = makeService('/contas');

export default {
  ...base,
  getFormas:   (id) => api.get(`/contas/${id}/formas`).then(r => r.data.data),
  setFormas:   (id, forma_ids) => api.put(`/contas/${id}/formas`, { forma_ids }).then(r => r.data),
  porForma:    (forma_pagamento_id) => api.get('/contas/por-forma', { params: { forma_pagamento_id } }).then(r => r.data.data),
  getSaldo:    (id) => api.get(`/contas/${id}/saldo`).then(r => r.data.data),
};
