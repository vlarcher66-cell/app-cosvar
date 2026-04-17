const service     = require('../services/empreendimentoService');
const loteService = require('../services/loteService');
const loteRepo    = require('../repositories/loteRepository');
const db          = require('../config/database');
const { success, error } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try { return success(res, await service.findAll(req.user.id)); }
  catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id, req.user.id);
    if (!data) return error(res, 'Empreendimento não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

const getLotes = async (req, res, next) => {
  try {
    const emp = await service.findById(req.params.id);
    if (!emp) return error(res, 'Empreendimento não encontrado', 404);
    const lotes = await loteService.findByEmpreendimento(req.params.id, req.user.id);
    return success(res, lotes);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const id = await service.create({ ...req.body, usuario_id: req.user.id });
    return success(res, { id }, 'Empreendimento criado', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    await service.update(req.params.id, { ...req.body, usuario_id: req.user.id });
    return success(res, null, 'Empreendimento atualizado');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.id);
    return success(res, null, 'Empreendimento excluído');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return error(res, 'Empreendimento em uso', 409);
    next(err);
  }
};

const getQuadras = async (req, res, next) => {
  try {
    const [quadras] = await db.query(
      `SELECT q.*,
         COUNT(l.id) AS total_lotes,
         SUM(CASE WHEN l.status = 'disponivel' THEN 1 ELSE 0 END) AS disponiveis,
         SUM(CASE WHEN l.status = 'reservado'  THEN 1 ELSE 0 END) AS reservados,
         SUM(CASE WHEN l.status = 'vendido'    THEN 1 ELSE 0 END) AS vendidos
       FROM quadra q
       LEFT JOIN lote l ON l.quadra_id = q.id
       WHERE q.empreendimento_id = ? AND q.usuario_id = ?
       GROUP BY q.id
       ORDER BY q.nome`,
      [req.params.id, req.user.id]
    );
    return success(res, quadras);
  } catch (err) { next(err); }
};

const createQuadra = async (req, res, next) => {
  try {
    const { nome } = req.body;
    if (!nome) return error(res, 'Nome da quadra obrigatório', 400);
    const [[existe]] = await db.query(
      `SELECT id FROM quadra WHERE empreendimento_id = ? AND nome = ? AND usuario_id = ? LIMIT 1`,
      [req.params.id, nome, req.user.id]
    );
    if (existe) return error(res, `Quadra "${nome}" já existe neste empreendimento`, 409);
    const [result] = await db.query(
      `INSERT INTO quadra (empreendimento_id, nome, usuario_id) VALUES (?, ?, ?)`,
      [req.params.id, nome, req.user.id]
    );
    return success(res, { id: result.insertId }, 'Quadra criada', 201);
  } catch (err) { next(err); }
};

const removeQuadra = async (req, res, next) => {
  try {
    const [[quadra]] = await db.query(
      `SELECT id FROM quadra WHERE id = ? AND empreendimento_id = ? AND usuario_id = ? LIMIT 1`,
      [req.params.quadra_id, req.params.id, req.user.id]
    );
    if (!quadra) return error(res, 'Quadra não encontrada', 404);
    // Lotes com contrato ativo não podem ser removidos
    const [[comContrato]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM lote l
       JOIN contrato_lote c ON c.lote_id = l.id AND c.status = 'ativo'
       WHERE l.quadra_id = ?`, [req.params.quadra_id]
    );
    if (comContrato.cnt > 0) return error(res, 'Quadra possui contratos ativos', 409);
    await db.query(`DELETE FROM quadra WHERE id = ?`, [req.params.quadra_id]);
    return success(res, null, 'Quadra removida');
  } catch (err) { next(err); }
};

const gerarLotes = async (req, res, next) => {
  try {
    const { quadra_id } = req.params;
    const { qtd, frente, fundo, preco_m2, numero_inicio } = req.body;

    if (!qtd || qtd < 1) return error(res, 'Quantidade de lotes inválida', 400);

    // Verifica se quadra pertence ao empreendimento e ao usuário
    const [[quadra]] = await db.query(
      `SELECT id FROM quadra WHERE id = ? AND empreendimento_id = ? AND usuario_id = ? LIMIT 1`,
      [quadra_id, req.params.id, req.user.id]
    );
    if (!quadra) return error(res, 'Quadra não encontrada', 404);

    // Descobre o próximo número disponível na quadra
    const [[ultimo]] = await db.query(
      `SELECT MAX(CAST(numero AS UNSIGNED)) AS max_num FROM lote WHERE quadra_id = ?`,
      [quadra_id]
    );
    const inicio = numero_inicio || (ultimo.max_num ? ultimo.max_num + 1 : 1);

    const area = frente && fundo ? parseFloat(frente) * parseFloat(fundo) : null;
    const dimensoes = frente && fundo ? `${frente}x${fundo}m` : null;
    const valor = area && preco_m2 ? parseFloat(area) * parseFloat(preco_m2) : null;

    const lotes = [];
    for (let i = 0; i < qtd; i++) {
      lotes.push({
        quadra_id,
        numero: String(inicio + i).padStart(2, '0'),
        area,
        dimensoes,
        valor,
        usuario_id: req.user.id,
      });
    }

    await loteRepo.createBulk(lotes);
    return success(res, { criados: lotes.length, inicio, fim: inicio + qtd - 1 }, `${qtd} lotes criados`, 201);
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, getLotes, create, update, remove, getQuadras, createQuadra, removeQuadra, gerarLotes };
