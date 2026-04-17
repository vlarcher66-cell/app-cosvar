const repo       = require('../repositories/documentoContratoRepository');
const { cloudinary, getUsage } = require('../config/cloudinary');
const { success, error } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const docs = await repo.findByContrato(req.params.contrato_id, req.user.id);
    return success(res, docs);
  } catch (err) { next(err); }
};

const upload = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'Nenhum arquivo enviado', 400);

    const id = await repo.create({
      contrato_id: req.params.contrato_id,
      nome:        req.body.nome || req.file.originalname,
      tipo:        req.body.tipo || null,
      url:         req.file.path,
      public_id:   req.file.filename,
      tamanho:     req.file.size || null,
      usuario_id:  req.user.id,
    });

    return success(res, { id, url: req.file.path }, 'Documento enviado', 201);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const public_id = await repo.remove(req.params.id, req.user.id);
    if (!public_id) return error(res, 'Documento não encontrado', 404);
    // Tenta deletar como raw (PDF/doc) e como image (fotos)
    await cloudinary.uploader.destroy(public_id, { resource_type: 'raw' }).catch(() => {});
    await cloudinary.uploader.destroy(public_id, { resource_type: 'image' }).catch(() => {});
    return success(res, null, 'Documento removido');
  } catch (err) { next(err); }
};

const usage = async (req, res, next) => {
  try {
    return success(res, await getUsage());
  } catch (err) { next(err); }
};

const download = async (req, res, next) => {
  try {
    const [[doc]] = await require('../config/database').query(
      `SELECT d.* FROM documento_contrato d
       JOIN contrato_lote c ON c.id = d.contrato_id AND c.usuario_id = ?
       WHERE d.id = ? LIMIT 1`,
      [req.user.id, req.params.id]
    );
    if (!doc) return error(res, 'Documento não encontrado', 404);

    const https = require('https');
    const http  = require('http');
    const urlObj = new URL(doc.url);
    const client = urlObj.protocol === 'https:' ? https : http;

    res.setHeader('Content-Disposition', `inline; filename="${doc.nome}"`);
    res.setHeader('Content-Type', 'application/pdf');

    client.get(doc.url, (stream) => {
      stream.pipe(res);
    }).on('error', next);
  } catch (err) { next(err); }
};

module.exports = { getAll, upload, remove, usage, download };
