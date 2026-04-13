import { formatDate, formatNumber } from '../../utils/formatters';

/* ─────────────────────────────────────────────
   OrdemPrint — janela de impressão profissional
   Uso: OrdemPrint.open(row, tipo)
   tipo: 'entrega' | 'venda'
───────────────────────────────────────────── */

function buildHTML(row, tipo) {
  const isVenda = tipo === 'venda';
  const titulo  = isVenda ? 'ORDEM DE VENDA' : 'ORDEM DE ENTREGA';
  const subtipo = isVenda ? 'Cacau a Ordem — Baixa de Estoque' : 'Cacau a Ordem — Registro de Entrega';

  const data        = row.data ? formatDate(row.data) : '—';
  const numero      = row.numero_ordem || '—';
  const credora     = row.credora || '—';
  const kg          = formatNumber(row.kg);
  const arrobas     = formatNumber(row.qtd_arrobas);
  const sacas       = formatNumber(Number(row.qtd_arrobas || 0) / 4);
  const preco       = row.preco_arroba ? `R$ ${Number(row.preco_arroba).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
  const total       = row.valor_total  ? `R$ ${Number(row.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
  const obs         = row.observacao || '';
  const emitidoEm   = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo} — ${numero}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: A4;
      margin: 0;
    }

    body {
      font-family: 'Source Sans 3', sans-serif;
      font-weight: 400;
      background: #fff;
      color: #1a1a1a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 14mm 16mm 12mm;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* ── Marca d'água ── */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-family: 'Playfair Display', serif;
      font-size: 88pt;
      font-weight: 700;
      color: rgba(0,0,0,0.028);
      letter-spacing: -0.02em;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
    }

    /* ── Faixa topo ── */
    .top-band {
      height: 5px;
      background: linear-gradient(90deg, #1a3a2a 0%, #2d6a4f 40%, #52b788 100%);
      margin: -14mm -16mm 0;
      margin-bottom: 0;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 10mm 0 8mm;
      border-bottom: 0.3px solid #c8c8c8;
    }

    .brand {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .brand-logo {
      height: 52px;
      width: auto;
      object-fit: contain;
      object-position: left;
    }

    .brand-sub {
      font-size: 8pt;
      color: #6b7280;
      font-weight: 300;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .doc-info {
      text-align: right;
    }

    .doc-tipo {
      font-family: 'Playfair Display', serif;
      font-size: 13pt;
      font-weight: 600;
      color: #1a3a2a;
      letter-spacing: 0.01em;
    }

    .doc-sub {
      font-size: 7.5pt;
      color: #9ca3af;
      font-weight: 300;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .doc-numero {
      margin-top: 6px;
      display: inline-block;
      font-family: 'Source Sans 3', monospace;
      font-size: 8.5pt;
      font-weight: 600;
      color: #fff;
      background: #1a3a2a;
      padding: 3px 10px;
      border-radius: 2px;
      letter-spacing: 0.08em;
    }

    /* ── Seção de identificação ── */
    .section {
      margin-top: 8mm;
    }

    .section-title {
      font-size: 6.5pt;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      margin-bottom: 4mm;
      padding-bottom: 2mm;
      border-bottom: 0.3px solid #e5e7eb;
    }

    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 5mm;
    }

    .fields-grid-2 {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 5mm;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .field-label {
      font-size: 6.5pt;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .field-value {
      font-size: 10.5pt;
      font-weight: 600;
      color: #1a1a1a;
      padding: 2mm 0;
      border-bottom: 0.6px solid #d1d5db;
      min-height: 8mm;
    }

    .field-value.highlight {
      color: #1a3a2a;
      font-size: 12pt;
    }

    /* ── Tabela de quantidades ── */
    .qty-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 2mm;
    }

    .qty-table thead tr {
      background: #1a3a2a;
    }

    .qty-table thead th {
      font-size: 7pt;
      font-weight: 600;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      padding: 3mm 4mm;
      text-align: left;
    }

    .qty-table thead th:not(:first-child) {
      text-align: right;
    }

    .qty-table tbody tr {
      border-bottom: 0.4px solid #e5e7eb;
    }

    .qty-table tbody tr:last-child {
      border-bottom: none;
    }

    .qty-table tbody td {
      font-size: 10pt;
      padding: 3.5mm 4mm;
      color: #1a1a1a;
    }

    .qty-table tbody td:not(:first-child) {
      text-align: right;
      font-weight: 600;
    }

    .qty-table tbody td.main-val {
      font-family: 'Playfair Display', serif;
      font-size: 13pt;
      font-weight: 600;
      color: #1a3a2a;
    }

    .qty-table tfoot tr {
      background: #f0fdf4;
      border-top: 1px solid #86efac;
    }

    .qty-table tfoot td {
      font-size: 9pt;
      font-weight: 600;
      padding: 3mm 4mm;
      color: #15803d;
      text-align: right;
    }

    .qty-table tfoot td:first-child {
      text-align: left;
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* ── Observação ── */
    .obs-box {
      border: 0.4px solid #d1d5db;
      border-radius: 3px;
      padding: 3mm 4mm;
      min-height: 14mm;
    }

    .obs-text {
      font-size: 9pt;
      color: #374151;
      line-height: 1.5;
      font-weight: 300;
    }

    .obs-empty {
      font-size: 8.5pt;
      color: #d1d5db;
      font-style: italic;
    }

    /* ── Declaração ── */
    .declaration {
      margin-top: 6mm;
      padding: 4mm;
      background: #f9fafb;
      border-left: 2px solid #1a3a2a;
    }

    .declaration p {
      font-size: 8.5pt;
      color: #6b7280;
      line-height: 1.6;
      font-weight: 300;
    }

    .declaration strong {
      color: #1a3a2a;
      font-weight: 600;
    }

    /* ── Assinaturas ── */
    .signatures {
      margin-top: 12mm;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12mm;
    }

    .sig-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2mm;
    }

    .sig-line {
      width: 100%;
      height: 0.6px;
      background: #374151;
    }

    .sig-label {
      font-size: 7.5pt;
      color: #6b7280;
      font-weight: 400;
      text-align: center;
      letter-spacing: 0.04em;
    }

    .sig-role {
      font-size: 6.5pt;
      color: #9ca3af;
      font-weight: 300;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* ── Rodapé ── */
    .footer {
      margin-top: auto;
      padding-top: 6mm;
      border-top: 0.3px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .footer-left {
      font-size: 7pt;
      color: #9ca3af;
      font-weight: 300;
      line-height: 1.6;
    }

    .footer-right {
      font-size: 7pt;
      color: #9ca3af;
      font-weight: 300;
      text-align: right;
      line-height: 1.6;
    }

    .footer-stamp {
      width: 18mm;
      height: 18mm;
      border: 0.8px solid #d1d5db;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .footer-stamp span {
      font-size: 5.5pt;
      color: #d1d5db;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      line-height: 1.4;
    }

    /* ── Bottom band ── */
    .bottom-band {
      height: 3px;
      background: linear-gradient(90deg, #52b788 0%, #2d6a4f 60%, #1a3a2a 100%);
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
    }

    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

<div class="watermark">COSVAR</div>

<div class="page">
  <div class="top-band"></div>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <img src="${location.origin}/logo.png" alt="Cosvar" class="brand-logo" />
      <div class="brand-sub">Sistema de Gestão Agrícola</div>
    </div>
    <div class="doc-info">
      <div class="doc-tipo">${titulo}</div>
      <div class="doc-sub">${subtipo}</div>
      <div class="doc-numero">${numero}</div>
    </div>
  </div>

  <!-- Identificação -->
  <div class="section">
    <div class="section-title">Identificação</div>
    <div class="fields-grid">
      <div class="field">
        <span class="field-label">Data da Operação</span>
        <span class="field-value highlight">${data}</span>
      </div>
      <div class="field">
        <span class="field-label">Nº do Documento</span>
        <span class="field-value">${numero}</span>
      </div>
      <div class="field">
        <span class="field-label">Credora / Contraparte</span>
        <span class="field-value highlight">${credora}</span>
      </div>
    </div>
  </div>

  <!-- Quantidades -->
  <div class="section">
    <div class="section-title">Quantidades</div>
    <table class="qty-table">
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Quantidade (KG)</th>
          <th>Quantidade (@)</th>
          <th>Quantidade (SC)</th>
          ${isVenda ? '<th>Preço / @</th><th>Valor Total</th>' : ''}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${isVenda ? 'Venda de Cacau a Ordem' : 'Entrega de Cacau a Ordem'}</td>
          <td class="main-val">${kg} kg</td>
          <td class="main-val">${arrobas} @</td>
          <td>${sacas} sc</td>
          ${isVenda ? `<td>${preco}</td><td class="main-val">${total}</td>` : ''}
        </tr>
      </tbody>
      ${isVenda && row.valor_total ? `
      <tfoot>
        <tr>
          <td>Total Geral</td>
          <td></td><td></td><td></td>
          <td></td>
          <td>${total}</td>
        </tr>
      </tfoot>` : ''}
    </table>
  </div>

  <!-- Observações -->
  <div class="section">
    <div class="section-title">Observações</div>
    <div class="obs-box">
      ${obs
        ? `<p class="obs-text">${obs}</p>`
        : `<p class="obs-empty">Nenhuma observação registrada.</p>`
      }
    </div>
  </div>

  <!-- Declaração -->
  <div class="declaration">
    <p>
      ${isVenda
        ? `Declaro que recebi de <strong>${credora}</strong> a quantidade de <strong>${kg} kg (${arrobas} @)</strong> de cacau a ordem, correspondente ao valor total de <strong>${total}</strong>, conforme acordado entre as partes.`
        : `Declaro que entrego à empresa <strong>Cosvar</strong> a quantidade de <strong>${kg} kg (${arrobas} @)</strong> de cacau a ordem, conforme registrado no sistema sob o número <strong>${numero}</strong>.`
      }
    </p>
  </div>

  <!-- Assinaturas -->
  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">${credora}</div>
      <div class="sig-role">${isVenda ? 'Credora / Vendedora' : 'Credora / Entregadora'}</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Cosvar — Responsável</div>
      <div class="sig-role">Empresa Receptora</div>
    </div>
  </div>

  <!-- Rodapé -->
  <div class="footer">
    <div class="footer-left">
      Emitido em: ${emitidoEm}<br/>
      Documento gerado pelo Sistema Cosvar<br/>
      Ref: ${numero}
    </div>
    <div class="footer-stamp">
      <span>Carimbo<br/>e<br/>Assinatura</span>
    </div>
    <div class="footer-right">
      Cosvar — Gestão Agrícola<br/>
      Este documento tem validade<br/>somente com assinatura das partes
    </div>
  </div>
</div>

<div class="bottom-band"></div>

<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  };
</script>
</body>
</html>`;
}

const OrdemPrint = {
  open(row, tipo) {
    const html = buildHTML(row, tipo);
    const win = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    win.document.write(html);
    win.document.close();
  }
};

export default OrdemPrint;
