import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import CurrencyInput from '../ui/CurrencyInput';
import clienteImovelService from '../../services/clienteImovelService';
import propostaLoteService from '../../services/propostaLoteService';
import s from './ModalProposta.module.css';

// Taxas padrão editáveis
const TAXAS_PADRAO = [
  { n: 12,  taxa: 0    },
  { n: 24,  taxa: 0    },
  { n: 36,  taxa: 0.99 },
  { n: 48,  taxa: 1.10 },
];

const parseBR = (v) => parseFloat(String(v || '0').replace(/\./g, '').replace(',', '.')) || 0;

function calcPMT(pv, taxa, n) {
  if (n <= 0) return 0;
  if (taxa <= 0) return pv / n;
  return pv * taxa / (1 - Math.pow(1 + taxa, -n));
}

export default function ModalProposta({ lote, onClose, onSaved }) {
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
  const [taxas, setTaxas] = useState(TAXAS_PADRAO.map(t => ({ ...t })));
  const [opcaoEscolhida, setOpcaoEscolhida] = useState(null); // idx da linha escolhida para converter
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
  const setN    = (i, val) => setTaxas(prev => prev.map((t, idx) => idx === i ? { ...t, n: parseInt(val) || 1 } : t));

  const handleSave = async () => {
    if (!valorLote) return alert('Informe o valor do lote');
    const nomeCliente = modoCliente === 'existente' ? clientes.find(c => String(c.id) === String(clienteId))?.nome : cliente.nome;
    if (!nomeCliente) return alert('Informe o nome do cliente');

    setSaving(true);
    try {
      await propostaLoteService.create({
        lote_id: lote.id,
        cliente_imovel_id: modoCliente === 'existente' ? clienteId : null,
        cliente: modoCliente === 'novo' ? cliente : null,
        valor_total: valor,
        desconto_avista_pct: parseFloat(descontoAVista || 0),
        entrada_pct: parseFloat(entradaPct || 0),
        entrada_valor: entrada,
        parcelas_json: opcoes,
        observacao,
      });
      onSaved?.();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erro ao salvar proposta');
    } finally { setSaving(false); }
  };

  const handlePrint = () => {
    const nomeCliente = modoCliente === 'existente'
      ? clientes.find(c => String(c.id) === String(clienteId))?.nome || ''
      : cliente.nome;
    const win = window.open('', '_blank');
    win.document.write(gerarHtmlProposta({
      lote, valorLote: valor, valorAVista, entrada, saldo,
      descontoAVista, entradaPct, opcoes, nomeCliente,
      cpf: modoCliente === 'novo' ? cliente.cpf_cnpj : clientes.find(c => String(c.id) === String(clienteId))?.cpf_cnpj || '',
      observacao,
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
                      <th>Total Financiado</th>
                      <th>Converter</th>
                    </tr>
                  </thead>
                  <tbody>
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
                            <span className={s.inputInlineSuffix}>% a.m.</span>
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

              <div className={s.nextRow} style={{ justifyContent: 'space-between' }}>
                <button className={s.btnSecondary} onClick={() => setAba('cliente')}>← Voltar</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={s.btnPrint} onClick={handlePrint}>🖨 Imprimir</button>
                  <button className={s.btnSave} onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Proposta'}
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
function gerarHtmlProposta({ lote, valorLote, valorAVista, entrada, saldo, descontoAVista, entradaPct, opcoes, nomeCliente, cpf, observacao }) {
  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const linhasParcelas = opcoes.map(op =>
    `<tr>
      <td>${op.n}x</td>
      <td>${op.taxa > 0 ? op.taxa.toFixed(2) + '% a.m.' : 'SEM JUROS'}</td>
      <td><strong>${fmt(op.pmt)}</strong></td>
      <td>${fmt(op.pmt * op.n + entrada)}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Proposta Comercial — COSVAR</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 2px solid #1e3a5f; padding-bottom: 16px; }
  .logo { font-size: 28px; font-weight: 900; color: #1e3a5f; letter-spacing: -1px; }
  .empresa { text-align: right; font-size: 11px; color: #555; line-height: 1.6; }
  h2 { font-size: 15px; color: #1e3a5f; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 16px; }
  .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #ddd; padding: 4px 0; }
  .row span { color: #555; }
  .row strong { color: #111; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { background: #1e3a5f; color: #fff; padding: 7px 10px; text-align: left; font-size: 12px; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tr:last-child td { border-bottom: none; }
  .highlight { background: #f0fdf4; }
  .obs { margin-top: 20px; font-size: 11px; color: #666; font-style: italic; }
  .rodape { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 10px; color: #999; text-align: center; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
  <div class="logo">COSVAR</div>
  <div class="empresa">Cosvar Imobiliária<br/>Proposta Comercial</div>
</div>

<h2>Dados do Imóvel</h2>
<div class="grid">
  <div class="row"><span>Empreendimento</span><strong>${lote?.empreendimento_nome || '—'}</strong></div>
  <div class="row"><span>Quadra / Lote</span><strong>Qd. ${lote?.quadra_nome} — Lote ${lote?.numero}</strong></div>
  ${lote?.area ? `<div class="row"><span>Área</span><strong>${lote.area} m²</strong></div>` : ''}
  ${lote?.dimensoes ? `<div class="row"><span>Dimensões</span><strong>${lote.dimensoes}</strong></div>` : ''}
  <div class="row"><span>Valor</span><strong>${fmt(valorLote)}</strong></div>
</div>

<h2>A/C — ${nomeCliente || ''}${cpf ? ` &nbsp;|&nbsp; CPF: ${cpf}` : ''}</h2>

<h2>Condições Comerciais</h2>
<div class="grid">
  <div class="row"><span>Valor do Imóvel</span><strong>${fmt(valorLote)}</strong></div>
  <div class="row highlight"><span>À Vista (${descontoAVista}% de desconto)</span><strong>${fmt(valorAVista)}</strong></div>
  <div class="row"><span>Entrada (${entradaPct}%)</span><strong>${fmt(entrada)}</strong></div>
  <div class="row"><span>Saldo a Financiar</span><strong>${fmt(saldo)}</strong></div>
</div>

<h2>Opções de Parcelamento</h2>
<table>
  <thead><tr><th>Parcelas</th><th>Juros</th><th>Valor da Parcela</th><th>Total Financiado</th></tr></thead>
  <tbody>${linhasParcelas}</tbody>
</table>

${observacao ? `<p class="obs">Obs: ${observacao}</p>` : ''}

<div class="rodape">Proposta válida por 15 dias a partir da emissão. Sujeita à aprovação cadastral.</div>
</body>
</html>`;
}
