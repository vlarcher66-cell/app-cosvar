const { makeController } = require('./makeController');
const service = require('../services/contaService');
const { success, error } = require('../utils/apiResponse');

const base = makeController(service);

const getFormas = async (req, res, next) => {
  try {
    const data = await service.getFormas(req.params.id);
    return success(res, data);
  } catch (err) { if (err.statusCode) return error(res, err.message, err.statusCode); next(err); }
};

const setFormas = async (req, res, next) => {
  try {
    await service.setFormas(req.params.id, req.body.forma_ids || []);
    return success(res, null, 'Formas atualizadas');
  } catch (err) { if (err.statusCode) return error(res, err.message, err.statusCode); next(err); }
};

const findByForma = async (req, res, next) => {
  try {
    const data = await service.findByForma(req.user.id, req.query.forma_pagamento_id);
    return success(res, data);
  } catch (err) { if (err.statusCode) return error(res, err.message, err.statusCode); next(err); }
};

const getSaldo = async (req, res, next) => {
  try {
    const data = await service.getSaldo(req.params.id, req.user.id);
    if (!data) return error(res, 'Conta não encontrada', 404);
    return success(res, data);
  } catch (err) { if (err.statusCode) return error(res, err.message, err.statusCode); next(err); }
};

module.exports = { ...base, getFormas, setFormas, findByForma, getSaldo };
