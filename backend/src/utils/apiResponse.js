/**
 * Resposta padronizada da API
 */
const success = (res, data = null, message = 'Sucesso', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const created = (res, data = null, message = 'Criado com sucesso') => {
  return res.status(201).json({ success: true, message, data });
};

const error = (res, message = 'Erro interno', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const paginated = (res, data, total, page, limit, message = 'Sucesso') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { success, created, error, paginated };
