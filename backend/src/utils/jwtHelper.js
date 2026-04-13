const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'cosvar_secret_change_me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

const verifyToken = (token) => jwt.verify(token, SECRET);

module.exports = { signToken, verifyToken };
