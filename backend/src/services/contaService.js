const { makeService } = require('./makeSimpleService');
const repo = require('../repositories/contaRepository');

const base = makeService(repo);

const getFormas    = (conta_id) => repo.getFormas(conta_id);
const setFormas    = (conta_id, forma_ids) => repo.setFormas(conta_id, forma_ids);
const findByForma  = (usuario_id, forma_pagamento_id) => repo.findByForma(usuario_id, forma_pagamento_id);
const getSaldo     = (id, usuario_id) => repo.getSaldo(id, usuario_id);

module.exports = { ...base, getFormas, setFormas, findByForma, getSaldo };
