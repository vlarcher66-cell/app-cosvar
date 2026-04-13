const { makeRepo } = require('./baseRepository');
module.exports = makeRepo('fornecedor', ['documento', 'contato', 'endereco']);
