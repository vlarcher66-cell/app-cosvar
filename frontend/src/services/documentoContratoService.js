import api from '../config/api';

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://app-cosvar-production.up.railway.app/api'
    : '/api';

export default {
  getAll:  (contrato_id)           => api.get(`/contratos-lote/${contrato_id}/documentos`).then(r => r.data.data),
  upload:  (contrato_id, formData) => api.post(`/contratos-lote/${contrato_id}/documentos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
  remove:  (contrato_id, id)       => api.delete(`/contratos-lote/${contrato_id}/documentos/${id}`).then(r => r.data),
  usage:   (contrato_id)           => api.get(`/contratos-lote/${contrato_id}/documentos/usage`).then(r => r.data.data),
  viewUrl: (contrato_id, id)       => `${BASE_URL}/contratos-lote/${contrato_id}/documentos/${id}/view`,
};
