import api from '../config/api';

export default {
  getMovimentos: (conta_id, mes, ano) =>
    api.get('/conciliacao', { params: { conta_id, mes, ano } }).then(r => r.data.data),

  setConciliado: (tipo, id, conciliado) =>
    api.patch(`/conciliacao/${tipo}/${id}`, { conciliado }).then(r => r.data),
};
