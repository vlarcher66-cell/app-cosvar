const repo = require('../repositories/usuarioRepository');
const { hashPassword } = require('../utils/bcryptHelper');

const findAll = () => repo.findAll();

const findById = async (id) => {
  const u = await repo.findById(id);
  if (!u) throw { statusCode: 404, message: 'Usuário não encontrado' };
  return u;
};

const create = async (data) => {
  const exists = await repo.findByEmail(data.email);
  if (exists) throw { statusCode: 409, message: 'Email já cadastrado' };
  const senha = await hashPassword(data.senha);
  return repo.create({ ...data, senha });
};

const update = async (id, data) => {
  await findById(id);
  if (data.email) {
    const exists = await repo.findByEmail(data.email);
    if (exists && exists.id !== parseInt(id)) {
      throw { statusCode: 409, message: 'Email já utilizado por outro usuário' };
    }
  }
  await repo.update(id, data);
};

const updateSenha = async (id, senhaAtual, novaSenha) => {
  const u = await repo.findById(id);
  if (!u) throw { statusCode: 404, message: 'Usuário não encontrado' };
  const { comparePassword, hashPassword: hp } = require('../utils/bcryptHelper');
  const ok = await comparePassword(senhaAtual, u.senha);
  if (!ok) throw { statusCode: 400, message: 'Senha atual incorreta' };
  const hash = await hp(novaSenha);
  await repo.updateSenha(id, hash);
};

const remove = async (id) => {
  await findById(id);
  await repo.remove(id);
};

module.exports = { findAll, findById, create, update, updateSenha, remove };
