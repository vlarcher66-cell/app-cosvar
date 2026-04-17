import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import CurrencyInput from '../ui/CurrencyInput';
import clienteImovelService from '../../services/clienteImovelService';
import propostaLoteService from '../../services/propostaLoteService';
import { LOGO_B64 } from './logoBase64';
import s from './ModalProposta.module.css';

// Opções fixas vinculadas: parcelas → taxa automática
const OPCOES_PADRAO = [
  { n: 12, taxa: 0    },
  { n: 24, taxa: 0.99 },
  { n: 36, taxa: 1.10 },
];

// Tabela de vinculação n → taxa padrão
const TAXA_POR_N = { 12: 0, 24: 0.99, 36: 1.10 };

const parseBR = (v) => parseFloat(String(v || '0').replace(/\./g, '').replace(',', '.')) || 0;

function calcPMT(pv, taxa, n) {
  if (n <= 0) return 0;
  if (taxa <= 0) return pv / n;
  return pv * taxa / (1 - Math.pow(1 + taxa, -n));
}

export default function ModalProposta({ lote, onClose, onSaved, onFecharNegocio }) {
  const [aba, setAba] = useState('lote');
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState([]);

  // Aba Lote — valor numérico puro (ex: "55000")
  const [valorLote, setValorLote] = useState(String(lote?.valor || ''));

  // Aba Cliente — pode selecionar existente ou criar novo
  const [modoCliente, setModoCliente] = useState('novo'); // 'novo' | 'existente'
  const [clienteId, setClienteId] = useState('');
  const [cliente, setCliente] = useState({ nome: '', cpf_cnpj: '', telefone: '', email: '', endereco: '' });

  // Aba Proposta
  const [descontoAVista, setDescontoAVista] = useState('5');
  const [entradaPct, setEntradaPct] = useState('30');
  const [taxas, setTaxas] = useState(OPCOES_PADRAO.map(t => ({ ...t })));
  const [opcaoEscolhida, setOpcaoEscolhida] = useState(null);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    clienteImovelService.getAll().then(setClientes).catch(() => {});
  }, []);

  const valor = parseFloat(valorLote) || 0;
  const descPct = parseFloat(descontoAVista || 0) / 100;
  const valorAVista = valor * (1 - descPct);
  const entPct = parseFloat(entradaPct || 0) / 100;
  const entrada = valor * entPct;
  const saldo = valor - entrada;

  const opcoes = taxas.map(t => {
    const taxa = t.taxa / 100;
    const pmt = calcPMT(saldo, taxa, t.n);
    return { n: t.n, taxa: t.taxa, pmt };
  });

  const setTaxa = (i, val) => setTaxas(prev => prev.map((t, idx) => idx === i ? { ...t, taxa: parseFloat(val) || 0 } : t));
  const setN    = (i, val) => {
    const n = parseInt(val) || 1;
    // Vincula taxa automaticamente se houver padrão para esse nº de parcelas
    const taxa = TAXA_POR_N.hasOwnProperty(n) ? TAXA_POR_N[n] : null;
    setTaxas(prev => prev.map((t, idx) => idx === i
      ? { ...t, n, taxa: taxa !== null ? taxa : t.taxa }
      : t
    ));
  };

  const [propostaSalva, setPropostaSalva] = useState(null); // { id, contrato_cliente_id }

  const handleSave = async () => {
    if (!valorLote) return alert('Informe o valor do lote');
    const nomeCliente = modoCliente === 'existente' ? clientes.find(c => String(c.id) === String(clienteId))?.nome : cliente.nome;
    if (!nomeCliente) return alert('Informe o nome do cliente');

    setSaving(true);
    try {
      const res = await propostaLoteService.create({
        lote_id: lote.id,
        cliente_imovel_id: modoCliente === 'existente' ? clienteId : null,
        cliente: modoCliente === 'novo' ? cliente : null,
        valor_total: valor,
        desconto_avista_pct: parseFloat(descontoAVista || 0),
        entrada_pct: parseFloat(entradaPct || 0),
        entrada_valor: entrada,
        parcelas_json: [{ n: 0, taxa: 0, pmt: valorAVista, avista: true }, ...opcoes],
        opcao_escolhida: opcaoEscolhida,
        observacao,
      });
      setPropostaSalva({ id: res.data?.id, cliente_imovel_id: res.data?.cliente_imovel_id });
      onSaved?.();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erro ao salvar proposta');
    } finally { setSaving(false); }
  };

  const handlePrint = () => {
    const nomeCliente = modoCliente === 'existente'
      ? clientes.find(c => String(c.id) === String(clienteId))?.nome || ''
      : cliente.nome;
    const now = new Date();
    const numeroProposta = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const win = window.open('', '_blank');
    win.document.write(gerarHtmlProposta({
      lote, valorLote: valor, valorAVista, entrada, saldo,
      descontoAVista, entradaPct, opcoes, nomeCliente,
      cpf: modoCliente === 'novo' ? cliente.cpf_cnpj : clientes.find(c => String(c.id) === String(clienteId))?.cpf_cnpj || '',
      observacao, numeroProposta, logoB64: LOGO_B64,
    }));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={s.header}>
          <div>
            <div className={s.title}>Proposta Comercial</div>
            <div className={s.sub}>Lote {lote?.numero} — Qd. {lote?.quadra_nome} — {lote?.empreendimento_nome || ''}</div>
          </div>
          <button className={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Abas */}
        <div className={s.tabs}>
          {['lote', 'cliente', 'proposta'].map(a => (
            <button key={a} className={`${s.tab} ${aba === a ? s.tabActive : ''}`} onClick={() => setAba(a)}>
              {a === 'lote' ? '1. Lote' : a === 'cliente' ? '2. Cliente' : '3. Proposta'}
            </button>
          ))}
        </div>

        <div className={s.body}>
          {/* ABA LOTE */}
          {aba === 'lote' && (
            <div className={s.abaContent}>
              <div className={s.grid2}>
                <div className={s.infoBox}><span>Empreendimento</span><strong>{lote?.empreendimento_nome || '—'}</strong></div>
                <div className={s.infoBox}><span>Quadra / Lote</span><strong>Qd. {lote?.quadra_nome} — Lote {lote?.numero}</strong></div>
                {lote?.area && <div className={s.infoBox}><span>Área</span><strong>{lote.area} m²</strong></div>}
                {lote?.dimensoes && <div className={s.infoBox}><span>Dimensões</span><strong>{lote.dimensoes}</strong></div>}
              </div>
              <div className={s.field}>
                <label>Valor do Lote (R$) *</label>
                <CurrencyInput
                  className={s.input}
                  value={valorLote}
                  onChange={e => setValorLote(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className={s.nextRow}>
                <button className={s.btnNext} onClick={() => setAba('cliente')}>Próximo: Cliente →</button>
              </div>
            </div>
          )}

          {/* ABA CLIENTE */}
          {aba === 'cliente' && (
            <div className={s.abaContent}>
              <div className={s.switchRow}>
                <button className={`${s.switchBtn} ${modoCliente === 'novo' ? s.switchActive : ''}`} onClick={() => setModoCliente('novo')}>Novo Cliente</button>
                <button className={`${s.switchBtn} ${modoCliente === 'existente' ? s.switchActive : ''}`} onClick={() => setModoCliente('existente')}>Cliente Existente</button>
              </div>

              {modoCliente === 'existente' ? (
                <div className={s.field}>
                  <label>Selecionar Cliente *</label>
                  <select className={s.select} value={clienteId} onChange={e => setClienteId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cpf_cnpj ? `— ${c.cpf_cnpj}` : ''}</option>)}
                  </select>
                </div>
              ) : (
                <div className={s.clienteGrid}>
                  <div className={s.field} style={{ gridColumn: '1/-1' }}>
                    <label>Nome Completo *</label>
                    <input className={s.input} value={cliente.nome} onChange={e => setCliente(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do cliente" />
                  </div>
                  <div className={s.field}>
                    <label>CPF / CNPJ</label>
                    <input className={s.input} value={cliente.cpf_cnpj} onChange={e => setCliente(p => ({ ...p, cpf_cnpj: e.target.value }))} placeholder="000.000.000-00" />
                  </div>
                  <div className={s.field}>
                    <label>Telefone</label>
                    <input className={s.input} value={cliente.telefone} onChange={e => setCliente(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
                  </div>
                  <div className={s.field}>
                    <label>E-mail</label>
                    <input className={s.input} value={cliente.email} onChange={e => setCliente(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
                  </div>
                  <div className={s.field}>
                    <label>Endereço</label>
                    <input className={s.input} value={cliente.endereco} onChange={e => setCliente(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, número, cidade" />
                  </div>
                </div>
              )}

              <div className={s.nextRow}>
                <button className={s.btnSecondary} onClick={() => setAba('lote')}>← Voltar</button>
                <button className={s.btnNext} onClick={() => setAba('proposta')}>Próximo: Proposta →</button>
              </div>
            </div>
          )}

          {/* ABA PROPOSTA */}
          {aba === 'proposta' && (
            <div className={s.abaContent}>
              {/* Parâmetros */}
              <div className={s.paramRow}>
                <div className={s.field}>
                  <label>Desconto à Vista (%)</label>
                  <div className={s.inputPct}>
                    <input className={s.input} type="number" step="0.1" min="0" max="100"
                      value={descontoAVista} onChange={e => setDescontoAVista(e.target.value)} />
                    <span className={s.pctSuffix}>%</span>
                  </div>
                </div>
                <div className={s.field}>
                  <label>Entrada (%)</label>
                  <div className={s.inputPct}>
                    <input className={s.input} type="number" step="1" min="0" max="100"
                      value={entradaPct} onChange={e => setEntradaPct(e.target.value)} />
                    <span className={s.pctSuffix}>%</span>
                  </div>
                </div>
                <div className={s.field}>
                  <label>Observação</label>
                  <input className={s.input} value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Opcional" />
                </div>
              </div>

              {/* Resumo */}
              <div className={s.resumo}>
                <div className={s.resumoItem}><span>Valor do Lote</span><strong>{formatCurrency(valor)}</strong></div>
                <div className={s.resumoItem}><span>À Vista ({descontoAVista}% desc.)</span><strong style={{ color: '#10b981' }}>{formatCurrency(valorAVista)}</strong></div>
                <div className={s.resumoItem}><span>Entrada ({entradaPct}%)</span><strong>{formatCurrency(entrada)}</strong></div>
                <div className={s.resumoItem}><span>Saldo a Financiar</span><strong>{formatCurrency(saldo)}</strong></div>
              </div>

              {/* Tabela de opções */}
              <div className={s.tabelaWrap}>
                <div className={s.tabelaTitle}>Opções de Parcelamento</div>
                <table className={s.tabela}>
                  <thead>
                    <tr>
                      <th>Parcelas</th>
                      <th>Taxa a.m. (%)</th>
                      <th>Valor da Parcela</th>
                      <th>Total</th>
                      <th>Sel.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Linha À Vista */}
                    <tr className={opcaoEscolhida === 'avista' ? s.rowSelected : s.rowAvista}>
                      <td><strong style={{ color: '#10b981' }}>À Vista</strong></td>
                      <td><span style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 700 }}>{descontoAVista}% de desconto</span></td>
                      <td className={s.mono}><strong style={{ color: '#10b981' }}>{formatCurrency(valorAVista)}</strong></td>
                      <td className={s.mono} style={{ color: '#10b981' }}>{formatCurrency(valorAVista)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="radio" name="opcao" checked={opcaoEscolhida === 'avista'}
                          onChange={() => setOpcaoEscolhida('avista')} />
                      </td>
                    </tr>
                    {opcoes.map((op, i) => (
                      <tr key={i} className={opcaoEscolhida === i ? s.rowSelected : ''}>
                        <td>
                          <div className={s.inputInlineGroup}>
                            <input className={s.inputSm} type="number" min="1" value={taxas[i].n}
                              onChange={e => setN(i, e.target.value)} />
                            <span className={s.inputInlineSuffix}>x</span>
                          </div>
                        </td>
                        <td>
                          <div className={s.inputInlineGroup}>
                            <input className={s.inputSm} type="number" step="0.01" min="0" value={taxas[i].taxa}
                              onChange={e => setTaxa(i, e.target.value)} />
                            <span className={s.inputInlineSuffix} style={{ color: op.taxa === 0 ? '#10b981' : 'var(--text-muted)' }}>
                              {op.taxa === 0 ? 'SEM JUROS' : '% a.m.'}
                            </span>
                          </div>
                        </td>
                        <td className={s.mono}><strong>{formatCurrency(op.pmt)}</strong></td>
                        <td className={s.mono}>{formatCurrency(op.pmt * op.n + entrada)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="radio" name="opcao" checked={opcaoEscolhida === i}
                            onChange={() => setOpcaoEscolhida(i)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {propostaSalva && (
                <div className={s.fecharNegocioBox}>
                  <span className={s.fecharNegocioTexto}>✅ Proposta salva! Cliente interessado?</span>
                  <button className={s.btnFecharNegocio} onClick={() => onFecharNegocio?.(propostaSalva)}>
                    Fechar Negócio → Contrato
                  </button>
                </div>
              )}

              <div className={s.nextRow} style={{ justifyContent: 'space-between' }}>
                <button className={s.btnSecondary} onClick={() => setAba('cliente')}>← Voltar</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={s.btnPrint} onClick={handlePrint}>🖨 Imprimir</button>
                  <button className={s.btnSave} onClick={handleSave} disabled={saving || !!propostaSalva}>
                    {saving ? 'Salvando...' : propostaSalva ? 'Salva ✓' : 'Salvar Proposta'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Gera HTML para impressão no padrão da proposta COSVAR
function gerarHtmlProposta({ lote, valorLote, valorAVista, entrada, saldo, descontoAVista, entradaPct, opcoes, nomeCliente, cpf, observacao, numeroProposta, logoB64 }) {
  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const dataEmissao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const linhasParcelas = [
    `<tr class="avista-row">
      <td style="padding:10px 14px"><strong>À VISTA</strong> — ${descontoAVista}% de desconto</td>
      <td style="padding:10px 14px;color:#16a34a;font-size:13px">—</td>
      <td style="padding:10px 14px;color:#16a34a;font-weight:700;font-size:14px">${fmt(valorAVista)}</td>
      <td style="padding:10px 14px;color:#16a34a;font-weight:700">${fmt(valorAVista)}</td>
    </tr>`,
    ...opcoes.map((op, i) => `<tr style="${i % 2 === 0 ? 'background:#f8fafc' : ''}">
      <td style="padding:9px 14px">${op.n}x</td>
      <td style="padding:9px 14px;color:${op.taxa === 0 ? '#16a34a' : '#374151'};font-weight:600">${op.taxa === 0 ? 'SEM JUROS' : String(op.taxa.toFixed(2)).replace('.', ',') + '% a.m.'}</td>
      <td style="padding:9px 14px;font-weight:700">${fmt(op.pmt)}</td>
      <td style="padding:9px 14px;color:#555">${fmt(op.pmt * op.n + entrada)}</td>
    </tr>`),
  ].join('');

  const logoHtml = logoB64
    ? `<img src="${logoB64}" alt="COSVAR" style="height:56px;max-width:200px;object-fit:contain"/>`
    : `<div style="font-size:32px;font-weight:900;color:#1e3a5f;letter-spacing:-1px">COSVAR</div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Proposta ${numeroProposta} — COSVAR</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Arial', sans-serif; font-size: 13px; color: #1a1a1a; background:#fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 36px 40px; }

  /* HEADER */
  .header { display:flex; justify-content:space-between; align-items:center; padding-bottom:18px; border-bottom:3px solid #1e3a5f; margin-bottom:24px; }
  .header-right { text-align:right; }
  .prop-num { font-size:11px; color:#888; letter-spacing:0.05em; text-transform:uppercase; }
  .prop-num strong { display:block; font-size:16px; color:#1e3a5f; letter-spacing:-0.5px; }
  .prop-data { font-size:11px; color:#888; margin-top:4px; }

  /* BADGE PROPOSTA COMERCIAL */
  .badge { display:inline-block; background:#1e3a5f; color:#fff; font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; padding:3px 10px; border-radius:3px; margin-bottom:20px; }

  /* SEÇÕES */
  .section { margin-bottom:22px; }
  .section-title { font-size:10px; font-weight:700; color:#1e3a5f; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:10px; padding-bottom:4px; border-bottom:1px solid #e2e8f0; }

  /* GRID INFO */
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; }
  .info-cell { padding:9px 14px; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0; }
  .info-cell:nth-child(2n) { border-right:none; }
  .info-cell:nth-last-child(-n+2) { border-bottom:none; }
  .info-cell .label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:2px; }
  .info-cell .value { font-size:13px; font-weight:600; color:#1a1a1a; }

  /* RESUMO FINANCEIRO */
  .financeiro { display:grid; grid-template-columns:repeat(4,1fr); gap:0; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; }
  .fin-cell { padding:10px 14px; border-right:1px solid #e2e8f0; }
  .fin-cell:last-child { border-right:none; }
  .fin-cell .label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px; }
  .fin-cell .value { font-size:14px; font-weight:700; color:#1a1a1a; }
  .fin-cell.destaque { background:#f0fdf4; }
  .fin-cell.destaque .value { color:#16a34a; }

  /* TABELA PARCELAMENTO */
  table { width:100%; border-collapse:collapse; border-radius:6px; overflow:hidden; border:1px solid #e2e8f0; }
  thead tr { background:#1e3a5f; }
  th { padding:10px 14px; text-align:left; font-size:11px; font-weight:700; color:#fff; letter-spacing:0.06em; text-transform:uppercase; }
  .avista-row { background:#f0fdf4; }
  td { border-bottom:1px solid #e2e8f0; font-size:13px; }
  tr:last-child td { border-bottom:none; }

  /* CLIENTE */
  .cliente-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px 16px; }
  .cliente-nome { font-size:15px; font-weight:700; color:#1e3a5f; }
  .cliente-cpf { font-size:11px; color:#888; margin-top:2px; }

  /* OBS + RODAPÉ */
  .obs { margin-top:18px; background:#fffbeb; border-left:3px solid #f59e0b; padding:8px 12px; font-size:11px; color:#78350f; border-radius:0 4px 4px 0; }
  .rodape { margin-top:30px; border-top:1px solid #e2e8f0; padding-top:12px; display:flex; justify-content:space-between; align-items:flex-end; }
  .rodape-texto { font-size:10px; color:#aaa; line-height:1.7; }
  .assinatura { text-align:center; }
  .assinatura-linha { width:180px; border-top:1px solid #555; margin-bottom:4px; }
  .assinatura-label { font-size:10px; color:#777; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 20px 28px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div>${logoHtml}</div>
    <div class="header-right">
      <div class="prop-num">Proposta Comercial<strong>#${numeroProposta}</strong></div>
      <div class="prop-data">Emitida em ${dataEmissao}</div>
    </div>
  </div>

  <!-- CLIENTE -->
  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="cliente-box">
      <div class="cliente-nome">${nomeCliente || '—'}</div>
      ${cpf ? `<div class="cliente-cpf">CPF / CNPJ: ${cpf}</div>` : ''}
    </div>
  </div>

  <!-- IMÓVEL -->
  <div class="section">
    <div class="section-title">Dados do Imóvel</div>
    <div class="info-grid">
      <div class="info-cell"><div class="label">Empreendimento</div><div class="value">${lote?.empreendimento_nome || '—'}</div></div>
      <div class="info-cell"><div class="label">Quadra / Lote</div><div class="value">Qd. ${lote?.quadra_nome} — Lote ${lote?.numero}</div></div>
      ${lote?.area ? `<div class="info-cell"><div class="label">Área</div><div class="value">${lote.area} m²</div></div>` : ''}
      ${lote?.dimensoes ? `<div class="info-cell"><div class="label">Dimensões</div><div class="value">${lote.dimensoes}</div></div>` : ''}
      <div class="info-cell"><div class="label">Valor do Imóvel</div><div class="value">${fmt(valorLote)}</div></div>
    </div>
  </div>

  <!-- RESUMO FINANCEIRO -->
  <div class="section">
    <div class="section-title">Resumo Financeiro</div>
    <div class="financeiro">
      <div class="fin-cell"><div class="label">Valor do Imóvel</div><div class="value">${fmt(valorLote)}</div></div>
      <div class="fin-cell destaque"><div class="label">À Vista (${descontoAVista}% desc.)</div><div class="value">${fmt(valorAVista)}</div></div>
      <div class="fin-cell"><div class="label">Entrada (${entradaPct}%)</div><div class="value">${fmt(entrada)}</div></div>
      <div class="fin-cell"><div class="label">Saldo a Financiar</div><div class="value">${fmt(saldo)}</div></div>
    </div>
  </div>

  <!-- PARCELAMENTO -->
  <div class="section">
    <div class="section-title">Opções de Parcelamento</div>
    <table>
      <thead><tr>
        <th>Modalidade</th>
        <th>Taxa</th>
        <th>Parcela Mensal</th>
        <th>Total</th>
      </tr></thead>
      <tbody>${linhasParcelas}</tbody>
    </table>
  </div>

  ${observacao ? `<div class="obs"><strong>Observação:</strong> ${observacao}</div>` : ''}

  <!-- RODAPÉ -->
  <div class="rodape">
    <div class="rodape-texto">
      Proposta válida por 15 dias a partir da emissão.<br/>
      Sujeita à aprovação cadastral. Valores em R$ (reais).
    </div>
    <div class="assinatura">
      <div class="assinatura-linha"></div>
      <div class="assinatura-label">Assinatura do Responsável</div>
    </div>
  </div>

</div>
</body>
</html>`;
}
