const authRepo = require('../repositories/authRepository');
const { comparePassword } = require('../utils/bcryptHelper');
const { signToken } = require('../utils/jwtHelper');

const login = async (email, senha) => {
  const usuario = await authRepo.findByEmail(email);
  if (!usuario) throw { statusCode: 401, message: 'Email ou senha inválidos' };

  const senhaOk = await comparePassword(senha, usuario.senha);
  if (!senhaOk) throw { statusCode: 401, message: 'Email ou senha inválidos' };

  const token = signToken({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    },
  };
};

const me = async (id) => {
  const usuario = await authRepo.findById(id);
  if (!usuario) throw { statusCode: 404, message: 'Usuário não encontrado' };
  return usuario;
};

module.exports = { login, me };
