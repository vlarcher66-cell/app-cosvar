import api from '../config/api';

export default {
  getAll:  (contrato_id)          => api.get(`/contratos-lote/${contrato_id}/documentos`).then(r => r.data.data),
  upload:  (contrato_id, formData) => api.post(`/contratos-lote/${contrato_id}/documentos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
  remove:  (contrato_id, id)      => api.delete(`/contratos-lote/${contrato_id}/documentos/${id}`).then(r => r.data),
};
