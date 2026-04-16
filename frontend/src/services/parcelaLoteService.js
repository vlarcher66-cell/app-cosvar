import api from '../config/api';

export default {
  getByContrato: (contrato_id) => api.get(`/parcelas-lote/contrato/${contrato_id}`).then(r => r.data.data),
  getVencidas:   ()            => api.get('/parcelas-lote/vencidas').then(r => r.data.data),
  getByMes:      (mes, ano)    => api.get('/parcelas-lote/por-mes', { params: { mes, ano } }).then(r => r.data.data),
  baixar:        (id, d)       => api.patch(`/parcelas-lote/${id}/baixar`, d).then(r => r.data),
  estornar:      (id)          => api.patch(`/parcelas-lote/${id}/estornar`).then(r => r.data),
};
