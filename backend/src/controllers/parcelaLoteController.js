const service = require('../services/parcelaLoteService');
const { success, error } = require('../utils/apiResponse');

const getByContrato = async (req, res, next) => {
  try { return success(res, await service.findByContrato(req.params.contrato_id)); }
  catch (err) { next(err); }
};

const getVencidas = async (req, res, next) => {
  try { return success(res, await service.findVencidas(req.user.id)); }
  catch (err) { next(err); }
};

const getByMes = async (req, res, next) => {
  try {
    const { mes, ano } = req.query;
    return success(res, await service.findByMes(req.user.id, mes, ano));
  } catch (err) { next(err); }
};

const baixar = async (req, res, next) => {
  try {
    await service.baixar(req.params.id, req.body, req.user.id);
    return success(res, null, 'Parcela baixada');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const estornar = async (req, res, next) => {
  try {
    await service.estornar(req.params.id, req.user.id);
    return success(res, null, 'Parcela estornada');
  } catch (err) { next(err); }
};

module.exports = { getByContrato, getVencidas, getByMes, baixar, estornar };
