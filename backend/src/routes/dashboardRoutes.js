const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
router.get('/resumo', ctrl.getResumo);
module.exports = router;
