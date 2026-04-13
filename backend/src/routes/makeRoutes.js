/**
 * Factory de rotas CRUD padrão
 */
const makeRoutes = (ctrl) => {
  const router = require('express').Router();
  router.get('/',     ctrl.getAll);
  router.get('/:id',  ctrl.getOne);
  router.post('/',    ctrl.create);
  router.put('/:id',  ctrl.update);
  router.delete('/:id', ctrl.remove);
  return router;
};

module.exports = { makeRoutes };
