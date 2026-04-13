export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const formatNumber = (value, decimals = 2) =>
  Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const formatDateInput = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.substring(0, 10);
};

export const statusLabel = {
  pago:      { label: 'Pago',      color: 'success' },
  pendente:  { label: 'Pendente',  color: 'warning' },
  recebido:  { label: 'Recebido',  color: 'success' },
  ativo:     { label: 'Ativo',     color: 'success' },
  inativo:   { label: 'Inativo',   color: 'danger'  },
  concluido: { label: 'Concluído', color: 'info'    },
  cancelado: { label: 'Cancelado', color: 'danger'  },
  parcial:   { label: 'Parcial',   color: 'info'    },
};
