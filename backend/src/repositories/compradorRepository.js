const { makeRepo } = require('./baseRepository');
module.exports = makeRepo('comprador', ['documento', 'contato']);
