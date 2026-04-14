const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

router.post('/login', ctrl.login);
router.get('/me', authMiddleware, ctrl.me);

// Rota temporária para resetar senha admin
router.get('/reset-admin', async (req, res) => {
  const hash = await bcrypt.hash('Admin@123', 12);
  await pool.query('UPDATE usuario SET senha = ? WHERE email = ?', [hash, 'admin@cosvar.com']);
  res.json({ ok: true, msg: 'Senha resetada com sucesso' });
});

module.exports = router;
