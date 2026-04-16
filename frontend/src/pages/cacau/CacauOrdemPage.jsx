import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../config/api';
import cacauOrdemService from '../../services/cacauOrdemService';
import cacauBaixaService from '../../services/cacauBaixaService';
import compradorService from '../../services/compradorService';
import contaService from '../../services/contaService';
import receitaService from '../../services/receitaService';
import formaPagamentoService from '../../services/formaPagamentoService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DateInput from '../../components/ui/DateInput';
import CurrencyInput from '../../components/ui/CurrencyInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DataTable from '../../components/shared/DataTable';
import { useGlobalToast } from '../../components/layout/MainLayout';
import { formatDate, formatDateInput, formatNumber } from '../../utils/formatters';
import OrdemPrint from './OrdemPrint';
import s from './CacauOrdemPage.module.css';

/* ─── constantes ─── */
const EMPTY_ENTREGA = { data: '', kg: '', qtd_arrobas: '', comprador_id: '', observacao: '' };
const EMPTY_BAIXA   = { data: '', comprador_id: '', kg: '', qtd_arrobas: '', preco_arroba: '', valor_total: '', observacao: '' };

const TABS = [
  { id: 'entrega', label: 'Ordem de Entrega', icon: <IcoEntrega /> },
  { id: 'baixa',   label: 'Ordem de Venda',    icon: <IcoBaixa /> },
  { id: 'analise', label: 'Análises',          icon: <IcoAnalise /> },
];

/* ══════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function CacauOrdemPage() {
  const toast = useGlobalToast();
  const [tab, setTab]   = useState('entrega');
  const [ano, setAno]   = useState(new Date().getFullYear());
  const [anos, setAnos] = useState([new Date().getFullYear()]);

  useEffect(() => {
    cacauBaixaService.getAnos().then(list => {
      if (list.length) { setAnos(list); setAno(list[0]); }
    }).catch(() => {});
  }, []);

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Cacau a Ordem</h1>
          <p className={s.pageSub}>Controle de entregas, baixas e análises por credora</p>
        </div>
        <select className={s.anoSelect} value={ano} onChange={e => setAno(Number(e.target.value))}>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <TabBar tab={tab} setTab={setTab} />

      {/* Conteúdo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        >
          {tab === 'entrega' && <TabEntrega toast={toast} ano={ano} />}
          {tab === 'baixa'   && <TabBaixa   toast={toast} ano={ano} />}
          {tab === 'analise' && <TabAnalise toast={toast} ano={ano} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Tab Bar ─── */
function TabBar({ tab, setTab }) {
  const refs  = useRef({});
  const [ink, setInk] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = refs.current[tab];
    if (el) setInk({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  return (
    <div className={s.tabBar}>
      <div className={s.tabList}>
        {TABS.map(t => (
          <button
            key={t.id}
            ref={el => refs.current[t.id] = el}
            className={`${s.tabBtn} ${tab === t.id ? s.tabBtnActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className={s.tabIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
        <motion.div
          className={s.tabInk}
          animate={{ left: ink.left, width: ink.width }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ABA 1 — ORDEM DE ENTREGA
══════════════════════════════════════════════════════════ */
function TabEntrega({ toast, ano }) {
  const [rows, setRows]       = useState([]);
  const [resumo, setResumo]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm]       = useState(EMPTY_ENTREGA);
  const [compradores, setCompradores]   = useState([]);
  const [quickCredora, setQuickCredora] = useState(false);
  const [novaCredora, setNovaCredora]   = useState('');
  const [savingCredora, setSavingCredora] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', comprador_id: '' });
  const [saldoEntrega, setSaldoEntrega]     = useState(null);
  const [loadingSaldoEnt, setLoadingSaldoEnt] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([,v]) => v));
      if (ano) params.ano = ano;
      const [data, res] = await Promise.all([
        cacauOrdemService.getAll(params),
        cacauOrdemService.getResumo(params),
      ]);
      setRows(data);
      setResumo(res);
    } catch { toast?.error('Erro ao carregar entregas'); }
    finally { setLoading(false); }
  }, [filtros, ano]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { compradorService.getAll().then(c => setCompradores(c)); }, []);
  useEffect(() => {
    if (modalOpen && compradores.length === 0) compradorService.getAll().then(c => setCompradores(c));
    if (!modalOpen) setSaldoEntrega(null);
  }, [modalOpen]);

  useEffect(() => {
    if (!form.comprador_id) { setSaldoEntrega(null); return; }
    setLoadingSaldoEnt(true);
    cacauOrdemService.getSaldoDisponivel(form.comprador_id, ano)
      .then(s => setSaldoEntrega(s))
      .catch(() => setSaldoEntrega(null))
      .finally(() => setLoadingSaldoEnt(false));
  }, [form.comprador_id, ano]);

  const set = (k, v) => setForm(p => {
    const next = { ...p, [k]: v };
    if (k === 'kg') { const kg = parseFloat(v); next.qtd_arrobas = isNaN(kg) ? '' : (kg / 15).toFixed(2); }
    return next;
  });

  const handleQuickCredora = async (e) => {
    e?.preventDefault(); e?.stopPropagation();
    if (!novaCredora.trim()) return;
    setSavingCredora(true);
    try {
      const nova = await compradorService.create({ nome: novaCredora.trim() });
      const lista = await compradorService.getAll();
      setCompradores(lista);
      set('comprador_id', String(nova.id));
      setNovaCredora(''); setQuickCredora(false);
      toast?.success(`Credora "${novaCredora.trim()}" cadastrada`);
    } catch { toast?.error('Erro ao cadastrar credora'); }
    finally { setSavingCredora(false); }
  };

  const openNew  = () => { setEditing(null); setForm(EMPTY_ENTREGA); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({ data: formatDateInput(row.data), kg: row.kg, qtd_arrobas: row.qtd_arrobas, comprador_id: String(row.comprador_id || ''), observacao: row.observacao || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await cacauOrdemService.update(editing.id, form); toast?.success('Ordem atualizada'); }
      else         { await cacauOrdemService.create(form); toast?.success('Ordem registrada'); }
      setModalOpen(false); load();
    } catch (err) {
      toast?.error(err.response?.data?.message || err.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await cacauOrdemService.remove(deleteTarget.id); toast?.success('Excluída'); setDeleteTarget(null); load(); }
    catch { toast?.error('Erro ao excluir'); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'data',         label: 'Data',    width: 100, render: v => formatDate(v) },
    { key: 'numero_ordem', label: 'Nº Ordem',width: 130, render: v => v ? <span className={s.ordemTag}>{v}</span> : '—' },
    { key: 'credora',      label: 'Credora' },
    { key: 'qtd_arrobas',  label: 'QTD @',   width: 90, align: 'center', render: v => `${formatNumber(v)} @` },
    { key: 'kg',           label: 'KG',      width: 90, align: 'center', render: v => `${formatNumber(v)} kg` },
    { key: '_actions', label: 'Ações', width: 110, align: 'center', render: (_, row) => (
      <div className={s.actions}>
        <ActionBtn type="print"  onClick={() => OrdemPrint.open(row, 'entrega')} title="Imprimir" />
        <ActionBtn type="edit"   onClick={() => openEdit(row)}      title="Editar" />
        <ActionBtn type="delete" onClick={() => setDeleteTarget(row)} title="Excluir" />
      </div>
    )},
  ];

  return (
    <>
      {/* KPIs */}
      {resumo && (
        <div className={s.kpis}>
          {[
            { label: 'Nº de Ordens',      value: resumo.total_ordens || rows.length,                                                color: 'neutral', icon: <IcoOrdem /> },
            { label: 'Total KG Entregue', value: `${formatNumber(resumo.total_kg)} kg`,                                              color: 'accent',  icon: <IcoKg /> },
            { label: 'Total Arrobas',     value: `${formatNumber(resumo.total_arrobas)} @`,                                          color: 'info',    icon: <IcoArroba /> },
            { label: 'Total Sacas',       value: `${formatNumber(Number(resumo.total_arrobas || 0) / 4)} sc`,                        color: 'warning', icon: <IcoSaca /> },
            { label: 'Saldo Disponível',  value: `${formatNumber(resumo.saldo_kg)} kg`,                                              color: resumo.saldo_kg >= 0 ? 'success' : 'danger', icon: <IcoSaldo /> },
          ].map((k, i) => (
            <motion.div key={k.label} className={`${s.kpi} ${s[`kpi_${k.color}`]}`}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.22 }}
            >
              <div className={s.kpiIcon}>{k.icon}</div>
              <div className={s.kpiText}>
                <div className={s.kpiValue}>{k.value}</div>
                <div className={s.kpiLabel}>{k.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filtros + botão */}
      <div className={s.toolbar}>
        <div className={s.toolbarLeft}>
          <DateInput className={s.filterInput} value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
          <DateInput className={s.filterInput} value={filtros.data_fim}    onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
          <select className={s.filterInput} value={filtros.comprador_id} onChange={e => setFiltros(p => ({ ...p, comprador_id: e.target.value }))}>
            <option value="">Todas as credoras</option>
            {compradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {(filtros.data_inicio || filtros.data_fim || filtros.comprador_id) && (
            <button className={s.clearBtn} onClick={() => setFiltros({ data_inicio: '', data_fim: '', comprador_id: '' })}>✕ Limpar</button>
          )}
        </div>
        <Button variant="primary" onClick={openNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Entrega
        </Button>
      </div>

      <DataTable columns={columns} data={rows} loading={loading} emptyMessage="Nenhuma ordem de entrega registrada" />

      {/* Modal entrega */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Ordem' : 'Nova Ordem de Entrega'} width={480}>
        <form onSubmit={handleSave} className={s.ordemForm}>
          <div className={s.ordemAutoField}>
            <span className={s.ordemAutoLabel}>Nº Ordem</span>
            <span className={s.ordemAutoBadge}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {editing ? (editing.numero_ordem || '—') : 'Gerado automaticamente'}
            </span>
          </div>
          <div className={s.ordemDivider} />

          <FieldGroup label="Data" required delay={0.05}>
            <DateInput className={s.ordemInput} value={form.data} onChange={e => set('data', e.target.value)} required />
          </FieldGroup>

          <FieldGroup label="Credora" required delay={0.10} extra={
            <button type="button" className={`${s.quickAddBtn} ${quickCredora ? s.quickAddBtnActive : ''}`}
              onClick={() => { setQuickCredora(p => !p); setNovaCredora(''); }}>
              <motion.span animate={{ rotate: quickCredora ? 45 : 0 }} transition={{ duration: 0.18 }} style={{ display: 'flex' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </motion.span>
              Nova
            </button>
          }>
            <select className={s.ordemSelect} value={form.comprador_id} onChange={e => set('comprador_id', e.target.value)} required={!quickCredora}>
              <option value="">Selecione a credora...</option>
              {compradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <AnimatePresence>
              {quickCredora && (
                <motion.div className={s.quickCredoraForm}
                  initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                  <input autoFocus type="text" className={s.quickCredoraInput} placeholder="Nome da nova credora..."
                    value={novaCredora} onChange={e => setNovaCredora(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleQuickCredora(e); }}} />
                  <button type="button" className={s.quickCredoraSave} disabled={savingCredora || !novaCredora.trim()} onClick={handleQuickCredora}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Salvar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </FieldGroup>

          <FieldGroup label="KG" required delay={0.15}>
            <div className={s.ordemKgWrap}>
              <input type="number" step="0.001" min="0"
                className={`${s.ordemInput} ${s.ordemInputKg} ${saldoEntrega && parseFloat(form.kg) > saldoEntrega.saldo_kg ? s.ordemInputError : ''}`}
                value={form.kg} onChange={e => set('kg', e.target.value)} placeholder="0.000" required />
              <span className={s.ordemKgUnit}>kg</span>
            </div>
            {form.comprador_id && !loadingSaldoEnt && saldoEntrega && (
              <div className={`${s.saldoEntregaInfo} ${saldoEntrega.saldo_kg <= 0 ? s.saldoEntregaZero : ''}`}>
                <span>Saldo disponível:</span>
                <strong className={parseFloat(form.kg) > saldoEntrega.saldo_kg ? s.saldoEntregaExcede : saldoEntrega.saldo_kg <= 0 ? s.saldoEntregaZeroVal : s.saldoEntregaOk}>
                  {formatNumber(saldoEntrega.saldo_kg)} kg
                </strong>
                {parseFloat(form.kg) > saldoEntrega.saldo_kg && (
                  <span className={s.saldoEntregaWarn}>⚠ Excede o saldo disponível</span>
                )}
              </div>
            )}
          </FieldGroup>

          <FieldGroup label="QTD @" delay={0.20} tag="auto">
            <div className={s.ordemCalcField}>
              <AnimatePresence mode="wait">
                <motion.span key={form.qtd_arrobas || 'e'} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.14 }} className={s.ordemCalcValue}>
                  {form.qtd_arrobas ? `${form.qtd_arrobas} @` : '—'}
                </motion.span>
              </AnimatePresence>
              <span className={s.ordemCalcHint}>KG ÷ 15</span>
            </div>
          </FieldGroup>

          <div className={s.ordemDivider} />

          <FieldGroup label="Observação" delay={0.25}>
            <textarea className={s.ordemTextarea} value={form.observacao}
              onChange={e => set('observacao', e.target.value)} rows={3} placeholder="Informações adicionais..." />
          </FieldGroup>

          <div className={s.ordemActions}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={saving}
              disabled={saving || (saldoEntrega && parseFloat(form.kg) > saldoEntrega.saldo_kg)}>
              {editing ? 'Salvar alterações' : 'Registrar Ordem'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleting} title="Excluir Ordem"
        message={`Excluir a ordem de "${deleteTarget?.credora || '—'}" em ${formatDate(deleteTarget?.data)}?`} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   ABA 2 — ORDEM DE BAIXA
══════════════════════════════════════════════════════════ */
function TabBaixa({ toast, ano }) {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [form, setForm]           = useState(EMPTY_BAIXA);
  const [compradores, setCompradores] = useState([]);
  const [filtros, setFiltros]     = useState({ data_inicio: '', data_fim: '', comprador_id: '' });
  const [totalKgBaixado, setTotalKgBaixado] = useState(0);
  const [saldoCredora, setSaldoCredora]     = useState(null);
  const [loadingSaldo, setLoadingSaldo]     = useState(false);
  const [saldoDisponivel, setSaldoDisponivel] = useState(null);
  const [saldosPorCredora, setSaldosPorCredora] = useState([]); // [{comprador_id, saldo_kg}]

  // Modal de recebimento pós-venda
  const [recebimentoOpen, setRecebimentoOpen]   = useState(false);
  const [recebimentoVenda, setRecebimentoVenda] = useState(null);
  const [contas, setContas]                     = useState([]);
  const [savingReceita, setSavingReceita]        = useState(false);
  const [formas, setFormas]                     = useState([]);
  const [novaForma, setNovaForma]               = useState('');
  const [savingForma, setSavingForma]           = useState(false);
  const [editingForma, setEditingForma]         = useState(null);
  const [editFormaVal, setEditFormaVal]         = useState('');
  const [savingEditForma, setSavingEditForma]   = useState(false);
  const [deletingForma, setDeletingForma]       = useState(null);
  // parcelas: [{_id, forma_id, conta_id, valor, formaDropOpen}]
  const [parcelas, setParcelas]                 = useState([]);
  const parcelaDropRefs                         = useRef({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([,v]) => v));
      if (ano) params.ano = ano;
      const [data, saldos] = await Promise.all([
        cacauBaixaService.getAll(params),
        cacauBaixaService.getSaldo(ano ? { ano } : {}),
      ]);
      setRows(data);
      setTotalKgBaixado(data.reduce((acc, r) => acc + Number(r.kg || 0), 0));
      const totalSaldo = saldos.reduce((acc, r) => acc + Number(r.saldo_kg || 0), 0);
      setSaldoDisponivel(totalSaldo);
      setSaldosPorCredora(saldos);
    } catch { toast?.error('Erro ao carregar baixas'); }
    finally { setLoading(false); }
  }, [filtros, ano]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { compradorService.getAll().then(c => setCompradores(c)); }, []);
  useEffect(() => {
    if (modalOpen && compradores.length === 0) compradorService.getAll().then(c => setCompradores(c));
    if (!modalOpen) setSaldoCredora(null);
  }, [modalOpen]);

  // Busca saldo quando credora muda no modal
  useEffect(() => {
    if (!form.comprador_id) { setSaldoCredora(null); return; }
    setLoadingSaldo(true);
    cacauBaixaService.getSaldoCredora(form.comprador_id)
      .then(s => setSaldoCredora(s))
      .catch(() => setSaldoCredora(null))
      .finally(() => setLoadingSaldo(false));
  }, [form.comprador_id]);

  const set = (k, v) => {
    setForm(p => {
      const next = { ...p, [k]: v };
      if (k === 'kg') {
        const kg = parseFloat(v);
        next.qtd_arrobas = (!isNaN(kg) && kg > 0) ? (kg / 15).toFixed(2) : '';
      }
      // recalcula valor total
      const arrobas = parseFloat(k === 'kg' ? (parseFloat(v) / 15) : next.qtd_arrobas) || 0;
      const preco   = parseFloat(k === 'preco_arroba' ? v : next.preco_arroba) || 0;
      next.valor_total = (arrobas > 0 && preco > 0) ? (arrobas * preco).toFixed(2) : '';
      return next;
    });
  };

  const openNew  = () => { setEditing(null); setForm(EMPTY_BAIXA); setSaldoCredora(null); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({ data: formatDateInput(row.data), comprador_id: String(row.comprador_id || ''), kg: row.kg, qtd_arrobas: row.qtd_arrobas, preco_arroba: row.preco_arroba || '', valor_total: row.valor_total || '', observacao: row.observacao || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) {
        await cacauBaixaService.update(editing.id, form);
        toast?.success('Venda atualizada');
        setModalOpen(false); load();
      } else {
        // Apenas abre o modal de recebimento — nada é salvo ainda
        setNovaForma('');
        setParcelas([{ _id: Date.now(), forma_id: '', conta_id: '', valor: form.valor_total || '', dropOpen: false }]);
        Promise.all([
          contaService.getAll(),
          formaPagamentoService.getAll(),
        ]).then(([c, f]) => { setContas(c); setFormas(f); });
        setModalOpen(false);
        setRecebimentoOpen(true);
      }
    } catch (err) {
      toast?.error(err.response?.data?.message || err.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleCadastrarForma = async () => {
    if (!novaForma.trim()) return;
    setSavingForma(true);
    try {
      await formaPagamentoService.create({ nome: novaForma.trim() });
      const lista = await formaPagamentoService.getAll();
      setFormas(lista);
      setNovaForma('');
    } catch { toast?.error('Erro ao cadastrar forma de pagamento'); }
    finally { setSavingForma(false); }
  };

  const handleEditForma = async (f) => {
    setSavingEditForma(true);
    try {
      await formaPagamentoService.update(f.id, { nome: editFormaVal.trim() });
      setFormas(await formaPagamentoService.getAll());
      setEditingForma(null);
    } catch { toast?.error('Erro ao editar forma de pagamento'); }
    finally { setSavingEditForma(false); }
  };

  const handleDeleteForma = async (id) => {
    setDeletingForma(id);
    try {
      await formaPagamentoService.remove(id);
      setFormas(await formaPagamentoService.getAll());
      setParcelas(prev => prev.map(p => String(p.forma_id) === String(id) ? { ...p, forma_id: '' } : p));
    } catch { toast?.error('Erro ao excluir forma de pagamento'); }
    finally { setDeletingForma(null); }
  };

  // helpers de parcela
  const setParcela = (id, field, val) =>
    setParcelas(prev => prev.map(p => p._id === id ? { ...p, [field]: val } : p));
  const addParcela = () =>
    setParcelas(prev => {
      const restante = Math.max(0, totalVenda - prev.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0));
      return [...prev, { _id: Date.now(), forma_id: '', conta_id: '', valor: restante > 0 ? restante.toFixed(2) : '', dropOpen: false }];
    });
  const removeParcela = (id) =>
    setParcelas(prev => prev.filter(p => p._id !== id));

  const totalParcelas  = parcelas.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
  const totalVenda     = parseFloat(form.valor_total) || 0;
  const diferencaParcelas = totalVenda - totalParcelas;

  const handleLancarReceita = async () => {
    if (parcelas.some(p => !p.conta_id)) { toast?.error('Selecione a conta em todas as parcelas'); return; }
    if (parcelas.some(p => !(parseFloat(p.valor) > 0))) { toast?.error('Informe o valor em todas as parcelas'); return; }
    if (Math.abs(diferencaParcelas) > 0.01) { toast?.error(`Diferença de R$ ${Math.abs(diferencaParcelas).toFixed(2)} — o total das parcelas deve ser igual ao valor da venda`); return; }
    setSavingReceita(true);
    try {
      await cacauBaixaService.vendaCompleta({
        ...form,
        parcelas: parcelas.map(p => ({ forma_pagamento_id: p.forma_id || null, conta_id: p.conta_id, valor: p.valor })),
      });
      toast?.success('Venda e recebimento registrados com sucesso!');
      setRecebimentoOpen(false);
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Erro ao registrar venda');
    } finally { setSavingReceita(false); }
  };

  const handlePularReceita = () => {
    // Fecha sem salvar — nada foi gravado no banco
    setRecebimentoOpen(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await cacauBaixaService.remove(deleteTarget.id); toast?.success('Excluída'); setDeleteTarget(null); load(); }
    catch { toast?.error('Erro ao excluir'); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'data',         label: 'Data',     width: 100, render: v => formatDate(v) },
    { key: 'numero_ordem', label: 'Nº Venda', width: 140, render: v => v ? <span className={s.ordemTag}>{v}</span> : '—' },
    { key: 'credora',      label: 'Credora' },
    { key: 'kg',          label: 'KG',        width: 100, align: 'right',
      render: v => <span className={s.kgBaixa}>{formatNumber(v)} kg</span> },
    { key: 'qtd_arrobas', label: 'QTD @',     width: 90,  align: 'right',
      render: v => <span className={s.arrobaBaixa}>{formatNumber(v)} @</span> },
    { key: 'preco_arroba', label: 'Preço/@',  width: 100, align: 'right',
      render: v => <span className={s.precoBaixa}>{v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</span> },
    { key: 'valor_total',  label: 'Total',    width: 110, align: 'right',
      render: v => <span className={s.totalBaixa}>{v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</span> },
    { key: 'observacao',  label: 'Obs.',      render: v => v || '—' },
    { key: '_actions', label: 'Ações', width: 110, align: 'center', render: (_, row) => (
      <div className={s.actions}>
        <ActionBtn type="print"  onClick={() => OrdemPrint.open(row, 'venda')}  title="Imprimir" />
        <ActionBtn type="edit"   onClick={() => openEdit(row)}       title="Editar" />
        <ActionBtn type="delete" onClick={() => setDeleteTarget(row)} title="Excluir" />
      </div>
    )},
  ];

  const kgInput   = parseFloat(form.kg) || 0;
  const saldoKg   = saldoCredora ? Number(saldoCredora.saldo_kg) : null;
  const excedeSaldo = saldoKg !== null && kgInput > saldoKg;

  const totalArrobasVendidas = rows.reduce((acc, r) => acc + Number(r.qtd_arrobas || 0), 0);
  const totalValorVendido    = rows.reduce((acc, r) => acc + Number(r.valor_total  || 0), 0);
  const precoMedio = totalArrobasVendidas > 0 ? totalValorVendido / totalArrobasVendidas : 0;

  return (
    <>
      {/* KPI resumo */}
      <div className={s.kpis}>
        {[
          { label: 'Nº de Vendas',         value: rows.length,                                          color: 'neutral', icon: <IcoOrdem /> },
          { label: 'Total KG Vendido',     value: `${formatNumber(totalKgBaixado)} kg`,               color: 'accent',  icon: <IcoKg /> },
          { label: 'Total Arrobas',        value: `${formatNumber(totalKgBaixado / 15)} @`,            color: 'info',    icon: <IcoArroba /> },
          { label: 'Preço Médio/@',        value: precoMedio > 0 ? `R$ ${precoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—', color: 'warning', icon: <IcoPreco /> },
          { label: 'Saldo p/ Venda',       value: saldoDisponivel !== null ? `${formatNumber(saldoDisponivel)} kg` : '—', color: saldoDisponivel !== null && saldoDisponivel <= 0 ? 'danger' : 'success', icon: <IcoSaldo /> },
        ].map((k, i) => (
          <motion.div key={k.label} className={`${s.kpi} ${s[`kpi_${k.color}`]}`}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.22 }}>
            <div className={s.kpiIcon}>{k.icon}</div>
            <div className={s.kpiText}>
              <div className={s.kpiValue}>{k.value}</div>
              <div className={s.kpiLabel}>{k.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={s.toolbar}>
        <div className={s.toolbarLeft}>
          <DateInput className={s.filterInput} value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
          <DateInput className={s.filterInput} value={filtros.data_fim}    onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
          <select className={s.filterInput} value={filtros.comprador_id} onChange={e => setFiltros(p => ({ ...p, comprador_id: e.target.value }))}>
            <option value="">Todas as credoras</option>
            {compradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {(filtros.data_inicio || filtros.data_fim || filtros.comprador_id) && (
            <button className={s.clearBtn} onClick={() => setFiltros({ data_inicio: '', data_fim: '', comprador_id: '' })}>✕ Limpar</button>
          )}
        </div>
        <Button variant="primary" onClick={openNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Venda
        </Button>
      </div>

      <DataTable columns={columns} data={rows} loading={loading} emptyMessage="Nenhuma baixa registrada" />

      {/* Modal baixa */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Venda' : 'Nova Ordem de Venda'} width={460}>
        <form onSubmit={handleSave} className={s.ordemForm}>
          <div className={s.ordemAutoField}>
            <span className={s.ordemAutoLabel}>Nº Venda</span>
            <span className={s.ordemAutoBadge}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {editing ? (editing.numero_ordem || '—') : 'Gerado automaticamente'}
            </span>
          </div>
          <div className={s.ordemDivider} />

          <FieldGroup label="Data" required delay={0.05}>
            <DateInput className={s.ordemInput} value={form.data} onChange={e => set('data', e.target.value)} required />
          </FieldGroup>

          <FieldGroup label="Credora" required delay={0.10}>
            <select className={s.ordemSelect} value={form.comprador_id} onChange={e => set('comprador_id', e.target.value)} required>
              <option value="">Selecione a credora...</option>
              {compradores
                .filter(c => {
                  const saldo = saldosPorCredora.find(s => String(s.comprador_id) === String(c.id));
                  return saldo && Number(saldo.saldo_kg) > 0;
                })
                .map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </FieldGroup>

          {/* Saldo da credora selecionada */}
          <AnimatePresence>
            {form.comprador_id && !loadingSaldo && saldoCredora && (
              <motion.div
                className={s.saldoInfoBox}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22 }}
              >
                <>
                    <div className={s.saldoInfoRow}>
                      <span className={s.saldoInfoLabel}>KG entregue</span>
                      <span className={s.saldoInfoVal}>{formatNumber(saldoCredora.kg_entregue)} kg</span>
                    </div>
                    <div className={s.saldoInfoRow}>
                      <span className={s.saldoInfoLabel}>Já baixado</span>
                      <span className={s.saldoInfoVal}>{formatNumber(saldoCredora.kg_baixado)} kg</span>
                    </div>
                    <div className={`${s.saldoInfoRow} ${s.saldoInfoRowHighlight}`}>
                      <span className={s.saldoInfoLabel}>Saldo disponível</span>
                      <span className={saldoKg <= 0 ? s.saldoInfoValZero : s.saldoInfoValSaldo}>
                        {formatNumber(saldoCredora.saldo_kg)} kg
                        <span className={s.saldoInfoArroba}>({formatNumber(Number(saldoCredora.saldo_kg) / 15)} @)</span>
                      </span>
                    </div>
                  </>
              </motion.div>
            )}
          </AnimatePresence>

          <FieldGroup label="KG" required delay={0.15}>
            <div className={s.ordemKgWrap}>
              <input
                type="number" step="0.001" min="0.001"
                className={`${s.ordemInput} ${s.ordemInputKg} ${excedeSaldo ? s.ordemInputError : ''}`}
                value={form.kg}
                onChange={e => set('kg', e.target.value)}
                placeholder="0.000"
                required
              />
              <span className={s.ordemKgUnit}>kg</span>
            </div>
            {excedeSaldo && (
              <span className={s.ordemInputWarn}>Excede o saldo disponível ({formatNumber(saldoKg)} kg)</span>
            )}
          </FieldGroup>

          <FieldGroup label="QTD @" tag="auto" delay={0.20}>
            <div className={s.ordemKgWrap}>
              <AnimatePresence mode="wait">
                <motion.input
                  key={form.qtd_arrobas || 'empty'}
                  type="text" readOnly
                  className={`${s.ordemInput} ${s.ordemInputKg} ${s.ordemInputReadonly}`}
                  value={form.qtd_arrobas ? `${form.qtd_arrobas}` : ''}
                  placeholder="0.000"
                  initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                />
              </AnimatePresence>
              <span className={s.ordemKgUnit}>@</span>
            </div>
          </FieldGroup>

          <FieldGroup label="Preço / @" required delay={0.25}>
            <div className={s.ordemKgWrap}>
              <input type="number" step="0.01" min="0.01"
                className={`${s.ordemInput} ${s.ordemInputKg}`}
                value={form.preco_arroba}
                onChange={e => set('preco_arroba', e.target.value)}
                placeholder="0,00" required />
              <span className={s.ordemKgUnit}>R$</span>
            </div>
          </FieldGroup>

          <FieldGroup label="Valor Total" tag="auto" delay={0.30}>
            <div className={s.ordemKgWrap}>
              <AnimatePresence mode="wait">
                <motion.input
                  key={form.valor_total || 'empty'}
                  type="text" readOnly
                  className={`${s.ordemInput} ${s.ordemInputKg} ${s.ordemInputReadonly} ${s.ordemInputValor}`}
                  value={form.valor_total ? `R$ ${Number(form.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                  placeholder="R$ 0,00"
                  initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                />
              </AnimatePresence>
            </div>
          </FieldGroup>

          <div className={s.ordemDivider} />

          <FieldGroup label="Observação" delay={0.35}>
            <textarea className={s.ordemTextarea} value={form.observacao}
              onChange={e => set('observacao', e.target.value)} rows={2} placeholder="Referência, forma de pagamento..." />
          </FieldGroup>

          <div className={s.ordemActions}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={saving} disabled={saving || excedeSaldo}>
              {editing ? 'Salvar alterações' : 'Registrar Venda'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleting} title="Excluir Venda"
        message={`Excluir a venda de "${deleteTarget?.credora}" (${formatNumber(deleteTarget?.kg)} kg)?`} />

      {/* ── Modal de recebimento ── */}
      <Modal isOpen={recebimentoOpen} onClose={handlePularReceita} title="Lançar Recebimento" width={420}>
        <div className={s.recebimentoModal}>
          <div className={s.recebimentoInfo}>
            <div className={s.recebimentoIco}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div>
              <div className={s.recebimentoTitulo}>Confirmar Recebimento</div>
              <div className={s.recebimentoSub}>Informe a forma e a conta para registrar a venda.</div>
            </div>
          </div>

          <div className={s.recebimentoValorBox}>
            <span className={s.recebimentoValorLabel}>Valor da venda</span>
            <span className={s.recebimentoValor}>
              R$ {Number(form.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className={s.recebimentoRow}>
            <span className={s.recebimentoLabel}>Credora</span>
            <span className={s.recebimentoValorSm}>{form.credora}</span>
          </div>
          <div className={s.recebimentoRow}>
            <span className={s.recebimentoLabel}>Data</span>
            <span className={s.recebimentoValorSm}>{formatDate(form.data)}</span>
          </div>

          <div className={s.ordemDivider} style={{ margin: '12px 0' }} />

          {/* ── Parcelas de pagamento ── */}
          <div className={s.parcelasLabel}>Formas de recebimento</div>

          {/* Lista de parcelas */}
          <div className={s.parcelasList}>
            {parcelas.map((p, idx) => (
              <div key={p._id} className={s.parcelaCard}
                ref={el => { parcelaDropRefs.current[p._id] = el; }}>
                {/* Linha 1: dropdown forma + editar/excluir formas */}
                <div className={s.parcelaFormaRow} style={{ position: 'relative' }}>
                  <button type="button" className={s.fpTrigger}
                    onClick={() => setParcela(p._id, 'dropOpen', !p.dropOpen)}>
                    <span style={{ color: p.forma_id ? 'var(--text-2)' : 'var(--text-muted)' }}>
                      {p.forma_id ? (formas.find(f => String(f.id) === String(p.forma_id))?.nome || 'Forma') : 'Forma de pagamento (opcional)'}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: p.dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <AnimatePresence>
                    {p.dropOpen && (
                      <motion.div className={s.fpDropdown}
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.13 }}>
                        <div className={`${s.fpItem} ${!p.forma_id ? s.fpItemSel : ''}`}
                          onClick={() => { setParcela(p._id, 'forma_id', ''); setParcela(p._id, 'dropOpen', false); }}>
                          <span className={s.fpItemNome} style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sem forma</span>
                        </div>
                        {formas.map(f => (
                          <div key={f.id} className={`${s.fpItem} ${String(p.forma_id) === String(f.id) ? s.fpItemSel : ''}`}
                            onClick={() => {
                              // Filtra contas compatíveis com a forma selecionada
                              const contasCompativeis = contas.filter(c => !c.formas_ids?.length || c.formas_ids.includes(f.id));
                              const contaAtual = contas.find(c => String(c.id) === String(p.conta_id));
                              const contaCompativel = contaAtual && (!contaAtual.formas_ids?.length || contaAtual.formas_ids.includes(f.id));
                              // Se só tiver uma conta compatível, preenche automaticamente
                              const novaConta = contaCompativel ? p.conta_id : (contasCompativeis.length === 1 ? String(contasCompativeis[0].id) : '');
                              setParcelas(prev => prev.map(pp => pp._id === p._id ? { ...pp, forma_id: String(f.id), dropOpen: false, conta_id: novaConta } : pp));
                            }}>
                            {editingForma?.id === f.id ? (
                              <div className={s.fpEditRow} onClick={e => e.stopPropagation()}>
                                <input autoFocus className={s.fpEditInput} value={editFormaVal}
                                  onChange={e => setEditFormaVal(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleEditForma(f); if (e.key === 'Escape') setEditingForma(null); }} />
                                <button type="button" className={s.fpBtnSave} onClick={() => handleEditForma(f)} disabled={savingEditForma || !editFormaVal.trim()}>{savingEditForma ? '...' : '✓'}</button>
                                <button type="button" className={s.fpBtnCancel} onClick={() => setEditingForma(null)}>✕</button>
                              </div>
                            ) : (
                              <>
                                <span className={s.fpItemNome}>{f.nome}</span>
                                <div className={s.fpActions} onClick={e => e.stopPropagation()}>
                                  <button type="button" className={s.fpBtnEdit} onClick={() => { setEditingForma(f); setEditFormaVal(f.nome); }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                  </button>
                                  <button type="button" className={s.fpBtnDel} disabled={deletingForma === f.id} onClick={() => handleDeleteForma(f.id)}>
                                    {deletingForma === f.id ? '...' : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        {/* Add nova forma direto no dropdown */}
                        <div className={s.fpAddRow}>
                          <input className={s.fpAddInput} placeholder="Nova forma (ex: PIX)..."
                            value={novaForma} onChange={e => setNovaForma(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCadastrarForma()} />
                          <button type="button" className={s.fpBtnAdd} onClick={handleCadastrarForma} disabled={savingForma || !novaForma.trim()}>
                            {savingForma ? '...' : '+ Add'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Linha 2: conta + valor + remover */}
                <div className={s.parcelaDetalheRow}>
                  <select className={s.parcelaSelect} value={p.conta_id} onChange={e => setParcela(p._id, 'conta_id', e.target.value)}>
                    <option value="">Conta *</option>
                    {(p.forma_id
                      ? contas.filter(c => !c.formas_ids?.length || c.formas_ids.includes(Number(p.forma_id)))
                      : contas
                    ).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.tipo === 'caixa' ? 'Caixa' : c.banco_nome ? `${c.banco_nome}` : c.numero}
                      </option>
                    ))}
                  </select>
                  <CurrencyInput className={s.parcelaValor}
                    placeholder="0,00" value={p.valor}
                    onChange={e => setParcela(p._id, 'valor', e.target.value)} />
                  {parcelas.length > 1 && (
                    <button type="button" className={s.parcelaRemove} onClick={() => removeParcela(p._id)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totalizador + adicionar parcela */}
          <div className={s.parcelasFooter}>
            <button type="button" className={s.parcelaAddBtn} onClick={addParcela}>
              + Adicionar forma
            </button>
            <div className={`${s.parcelasTotal} ${Math.abs(diferencaParcelas) > 0.01 ? s.parcelasTotalErro : s.parcelasTotalOk}`}>
              {Math.abs(diferencaParcelas) > 0.01
                ? `Falta: R$ ${Math.abs(diferencaParcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : '✓ Total ok'}
            </div>
          </div>

          <div className={s.recebimentoActions}>
            <Button variant="primary" onClick={handleLancarReceita} loading={savingReceita} disabled={savingReceita}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Lançar receita
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   ABA 3 — ANÁLISES
══════════════════════════════════════════════════════════ */
function TabAnalise({ toast, ano }) {
  const [saldo, setSaldo]           = useState([]);
  const [resumo, setResumo]         = useState(null);
  const [financeiro, setFinanceiro] = useState(null);
  const [vendasMes, setVendasMes]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filtroCredora, setFiltroCredora] = useState('');

  useEffect(() => {
    setLoading(true);
    const p = ano ? { ano } : {};
    Promise.all([
      api.get('/cacau-baixa/saldo',              { params: p }).then(r => r.data),
      api.get('/cacau-baixa/resumo',             { params: p }).then(r => r.data),
      api.get('/cacau-baixa/saldo-financeiro',   { params: p }).then(r => r.data),
      api.get('/cacau-baixa/vendas-por-mes',     { params: p }).then(r => r.data),
    ])
      .then(([s, r, f, v]) => { setSaldo(s); setResumo(r); setFinanceiro(f); setVendasMes(v); })
      .catch(() => toast?.error('Erro ao carregar análises'))
      .finally(() => setLoading(false));
  }, [ano]);

  if (loading) return <div className={s.loadingMsg}>Carregando análises...</div>;

  const saldoFiltrado = filtroCredora
    ? saldo.filter(r => r.credora.toLowerCase().includes(filtroCredora.toLowerCase()))
    : saldo;

  const totalKg         = resumo?.total_kg || 0;
  const totalArroba     = resumo?.total_arrobas || 0;
  const totalKgBaixado  = resumo?.total_kg_baixado || 0;
  const totalFinanceiro = financeiro?.total_saldo_financeiro || 0;
  const fmtBRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // dados para gráfico de barras (entregue vs vendido por credora)
  const barData = saldo.map(item => ({
    name: item.credora.length > 14 ? item.credora.slice(0, 14) + '…' : item.credora,
    Entregue: Number(item.total_kg_entregue || 0),
    Vendido:  Number(item.total_kg_baixado  || 0),
    Saldo:    Number(item.saldo_kg || 0),
  }));

  const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'var(--font)',
    color: 'var(--text)',
  };

  return (
    <div className={s.analise}>
      {/* KPIs */}
      <div className={s.kpis}>
        {[
          { label: 'KG Total Entregue', value: `${formatNumber(totalKg)} kg`,       color: 'accent',  icon: <IcoKg /> },
          { label: 'Arrobas Totais',    value: `${formatNumber(totalArroba)} @`,     color: 'info',    icon: <IcoArroba /> },
          { label: 'KG Total Vendido',  value: `${formatNumber(totalKgBaixado)} kg`, color: 'success', icon: <IcoBaixaKpi /> },
          { label: 'Nº Credoras',       value: saldo.length,                               color: 'neutral', icon: <IcoCredora /> },
          { label: 'A Receber (est.)',  value: fmtBRL(totalFinanceiro),                    color: 'warning', icon: <IcoValor /> },
        ].map((k, i) => (
          <motion.div key={k.label} className={`${s.kpi} ${s[`kpi_${k.color}`]}`}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.22 }}>
            <div className={s.kpiIcon}>{k.icon}</div>
            <div className={s.kpiText}>
              <div className={s.kpiValue}>{k.value}</div>
              <div className={s.kpiLabel}>{k.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gráficos */}
      <div className={s.chartsRow}>

        {/* Barras — entregue vs vendido por credora */}
        <div className={s.chartCard}>
          <div className={s.chartHeader}>
            <h3 className={s.chartTitle}>KG por Credora</h3>
            <p className={s.chartSub}>Entregue · Vendido · Saldo</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font)' }} axisLine={false} tickLine={false} width={45} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} kg`, n]} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font)' }} />
              <Bar dataKey="Entregue" fill="#2563eb" radius={[4,4,0,0]} />
              <Bar dataKey="Vendido"  fill="#059669" radius={[4,4,0,0]} />
              <Bar dataKey="Saldo"    fill="#d97706" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Linha — vendas KG por mês */}
        <div className={s.chartCard}>
          <div className={s.chartHeader}>
            <h3 className={s.chartTitle}>Vendas por Mês</h3>
            <p className={s.chartSub}>KG vendido nos últimos 12 meses</p>
          </div>
          {vendasMes.length === 0 ? (
            <div className={s.chartEmpty}>
              <IcoEmpty />
              <p>Sem dados de vendas ainda</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={vendasMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes_label" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font)' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [n === 'KG' ? `${v} kg` : fmtBRL(v), n]} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font)' }} />
                <Line type="monotone" dataKey="total_kg" name="KG" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="total_valor" name="Valor R$" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4, fill: '#d97706' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabela saldo por credora */}
      <div className={s.saldoTable}>
        <div className={s.saldoHeader}>
          <div>
            <h3 className={s.saldoTitle}>Saldo por Credora</h3>
            <p className={s.saldoSub}>Total entregue vs total vendido · A receber estimado</p>
          </div>
          <input type="text" className={`${s.filterInput} ${s.filterInputText}`} value={filtroCredora} onChange={e => setFiltroCredora(e.target.value)} placeholder="Filtrar credora..." />
        </div>
        {saldoFiltrado.length === 0 ? (
          <div className={s.emptyState}><IcoEmpty /><p>Nenhum dado disponível</p></div>
        ) : (
          <div className={s.saldoRows}>
            {saldoFiltrado.map((item, i) => {
              const kgEnt    = Number(item.total_kg_entregue || 0);
              const kgBx     = Number(item.total_kg_baixado  || 0);
              const pct      = kgEnt > 0 ? Math.min((kgBx / kgEnt) * 100, 100) : 0;
              const saldoKg  = Number(item.saldo_kg || 0);
              const finItem  = financeiro?.por_credora?.find(f => f.credora === item.credora);
              const saldoFin = finItem?.saldo_financeiro || 0;
              const ultimoPreco = finItem?.ultimo_preco || 0;
              return (
                <motion.div key={item.credora} className={s.saldoRow}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.22 }}>
                  <div className={s.saldoRowTop}>
                    <div className={s.saldoCredora}>
                      <span className={s.saldoCredoraIcon}>{item.credora[0]?.toUpperCase()}</span>
                      <div>
                        <div className={s.saldoCredoraNome}>{item.credora}</div>
                        <div className={s.saldoCredoraSub}>{item.total_ordens} ordens · {formatNumber(item.total_arrobas_entregue)} @</div>
                      </div>
                    </div>
                    <div className={s.saldoNums}>
                      <div className={s.saldoNumItem}>
                        <span className={s.saldoNumLabel}>Entregue</span>
                        <span className={s.saldoNumKg}>{formatNumber(kgEnt)} kg</span>
                      </div>
                      <div className={s.saldoNumDivider} />
                      <div className={s.saldoNumItem}>
                        <span className={s.saldoNumLabel}>Vendido</span>
                        <span className={s.saldoNumValor}>{formatNumber(kgBx)} kg</span>
                      </div>
                      <div className={s.saldoNumDivider} />
                      <div className={s.saldoNumItem}>
                        <span className={s.saldoNumLabel}>Saldo KG</span>
                        <span className={saldoKg <= 0 ? s.saldoNumZero : s.saldoNumBaixas}>{formatNumber(saldoKg)} kg</span>
                      </div>
                      <div className={s.saldoNumDivider} />
                      <div className={s.saldoNumItem}>
                        <span className={s.saldoNumLabel}>Últ. preço</span>
                        <span className={s.saldoNumPreco}>{ultimoPreco > 0 ? fmtBRL(ultimoPreco) : '—'}</span>
                      </div>
                      <div className={s.saldoNumDivider} />
                      <div className={s.saldoNumItem}>
                        <span className={s.saldoNumLabel}>A Receber</span>
                        <span className={s.saldoNumFinanceiro}>{saldoFin > 0 ? fmtBRL(saldoFin) : '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className={s.saldoBar}>
                    <motion.div className={s.saldoBarFill}
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.06 + 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function FieldGroup({ label, required, delay = 0, tag, extra, children }) {
  return (
    <motion.div className={s.ordemFieldGroup}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.18 }}>
      <div className={s.ordemLabelRow}>
        <label className={s.ordemLabel}>
          {label}
          {required && <span className={s.ordemRequired}>*</span>}
          {tag && <span className={s.ordemAutoTag}>{tag}</span>}
        </label>
        {extra}
      </div>
      {children}
    </motion.div>
  );
}

function ActionBtn({ type, onClick, title }) {
  const cls = type === 'edit' ? s.btnEdit : type === 'print' ? s.btnPrint : s.btnDelete;
  return (
    <motion.button className={cls} onClick={onClick} title={title}
      whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.90 }}
    >
      {type === 'edit'
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        : type === 'print'
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      }
    </motion.button>
  );
}

/* ─── Ícones ─── */
function IcoEntrega() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>; }
function IcoBaixa()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; }
function IcoAnalise() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function IcoKg()      { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>; }
function IcoArroba()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/></svg>; }
function IcoOrdem()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function IcoClock()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IcoSaca()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v4H3z"/><path d="M5 7v13a1 1 0 001 1h12a1 1 0 001-1V7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>; }
function IcoSaldo()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>; }
function IcoBaixaKpi(){ return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IcoValor()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>; }
function IcoCredora() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function IcoEmpty()   { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:.3}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function IcoPreco()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v2m0 8v2M9.5 9.5a2.5 2.5 0 015 0c0 1.5-1 2-2.5 2.5S9.5 13 9.5 14.5a2.5 2.5 0 005 0"/></svg>; }
