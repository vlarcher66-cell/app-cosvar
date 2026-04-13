/**
 * Factory de service para cadastros simples (CRUD sem regras complexas)
 */
const makeService = (repo) => {
  const findAll = (usuario_id) => repo.findAll(usuario_id);

  const findById = async (id, usuario_id) => {
    const item = await repo.findById(id, usuario_id);
    if (!item) throw { statusCode: 404, message: 'Registro não encontrado' };
    return item;
  };

  const create = (data) => repo.create(data);

  const update = async (id, data) => {
    await findById(id, data.usuario_id);
    await repo.update(id, data);
  };

  const remove = async (id, usuario_id) => {
    await findById(id, usuario_id);
    try {
      await repo.remove(id, usuario_id);
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        throw { statusCode: 409, message: 'Registro em uso, não pode ser excluído' };
      }
      throw err;
    }
  };

  return { findAll, findById, create, update, remove };
};

module.exports = { makeService };
