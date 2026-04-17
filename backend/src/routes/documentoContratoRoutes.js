const router = require('express').Router({ mergeParams: true });
const ctrl   = require('../controllers/documentoContratoController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

router.use(authMiddleware);
router.get('/usage',        ctrl.usage);
router.get('/',             ctrl.getAll);
router.get('/:id/view',     ctrl.download);
router.post('/', upload.single('arquivo'), ctrl.upload);
router.delete('/:id',       ctrl.remove);

module.exports = router;
