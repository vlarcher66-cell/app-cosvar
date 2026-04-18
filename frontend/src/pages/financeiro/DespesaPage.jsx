import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import despesaService from '../../services/despesaService';
import grupoDespesaService from '../../services/grupoDespesaService';
import itemDespesaService from '../../services/itemDespesaService';
import fornecedorService from '../../services/fornecedorService';
import compradorService from '../../services/compradorService';
import centroCustoService from '../../services/centroCustoService';
import projetoService from '../../services/projetoService';
import contaService from '../../services/contaService';
import Modal from '../../components/ui/Modal';
import DateInput from '../../components/ui/DateInput';
import CurrencyInput from '../../components/ui/CurrencyInput';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DataTable from '../../components/shared/DataTable';
import { useGlobalToast } from '../../components/layout/MainLayout';
import { formatCurrency, formatDate, formatDateInput } from '../../utils/formatters';
import s from './DespesaPage.module.css';

/* Campos compartilhados entre todos os itens do lote */
const EMPTY_SHARED = {
  fornecedor_id: '', comprador_id: '', centro_custo_id: '',
  projeto_id: '', conta_id: '', data: '', descricao: '', status: 'pendente', desconto: '',
};

/* Um item da lista */
const EMPTY_ITEM_ROW = { _key: 0, item_id: '', subgrupo_id: '', grupo_id: '', item: null, valor: '' };

/* ── Ícones ── */
const IcoPago     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IcoPendente = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoTotal    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcoCount    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IcoEdit     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoDelete   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoPlus     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoFilter   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const IcoBaixa    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcoAPagar   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoPagas    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IcoAnalise  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;

const TABS = [
  { id: 'apagar',   label: 'A Pagar',  icon: <IcoAPagar /> },
  { id: 'pagas',    label: 'Pagas',    icon: <IcoPagas />  },
  { id: 'analises', label: 'Análises', icon: <IcoAnalise /> },
];

function TabBar({ tab, setTab }) {
  const refs = useRef([]);
  const [ink, setInk] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const idx = TABS.findIndex(t => t.id === tab);
    const el = refs.current[idx];
    if (el) setInk({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);
  return (
    <div className={s.tabBar}>
      <div className={s.tabList}>
        <motion.div className={s.tabInk} animate={ink} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
        {TABS.map((t, i) => (
          <button key={t.id} ref={el => refs.current[i] = el}
            className={`${s.tabBtn} ${tab === t.id ? s.tabBtnActive : ''}`}
            onClick={() => setTab(t.id)}>
            <span className={s.tabIcon}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] } }),
};

let _keyCounter = 1;
const newKey = () => ++_keyCounter;

/* ── ItemSearchRow — linha do carrinho com busca de item ── */
function ItemSearchRow({ row, todosItens, onChange, onRemove, canRemove }) {
  const [query, setQuery]               = useState('');
  const [grupoFiltro, setGrupoFiltro]   = useState('');
  const [subgrupoFiltro, setSubgrupoFiltro] = useState('');
  const [dropOpen, setDropOpen]         = useState(false);
  const [dropPos, setDropPos]           = useState({ top: 0, left: 0, width: 0 });
  const ref     = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Grupos únicos
  const grupos = [...new Map(
    todosItens.filter(it => it.grupo_id).map(it => [it.grupo_id, { id: it.grupo_id, nome: it.grupo_nome }])
  ).values()].sort((a, b) => a.nome.localeCompare(b.nome));

  // Subgrupos filtrados pelo grupo selecionado
  const subgrupos = [...new Map(
    todosItens
      .filter(it => it.subgrupo_id && (!grupoFiltro || String(it.grupo_id) === String(grupoFiltro)))
      .map(it => [it.subgrupo_id, { id: it.subgrupo_id, nome: it.subgrupo_nome }])
  ).values()].sort((a, b) => a.nome.localeCompare(b.nome));

  const filtrados = todosItens.filter(it => {
    if (grupoFiltro    && String(it.grupo_id)    !== String(grupoFiltro))    return false;
    if (subgrupoFiltro && String(it.subgrupo_id) !== String(subgrupoFiltro)) return false;
    if (!query) return true;
    return it.nome.toLowerCase().includes(query.toLowerCase()) ||
      it.subgrupo_nome?.toLowerCase().includes(query.toLowerCase()) ||
      it.grupo_nome?.toLowerCase().includes(query.toLowerCase());
  });

  const abrirDrop = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setDropOpen(true);
  };

  const selecionar = (item) => {
    onChange({ ...row, item_id: item.id, subgrupo_id: item.subgrupo_id, grupo_id: item.grupo_id, item });
    setQuery(''); setDropOpen(false);
  };

  const limpar = () => {
    onChange({ ...row, item_id: '', subgrupo_id: '', grupo_id: '', item: null });
  };

  const dropStyle = { position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 };

  const dropdown = dropOpen ? createPortal(
    <ul className={s.itemDropdown} style={dropStyle}>
      {filtrados.length > 0
        ? filtrados.slice(0, 12).map(it => (
            <li key={it.id} className={s.itemDropItem} onMouseDown={(e) => { e.preventDefault(); selecionar(it); }}>
              <span className={s.itemDropNome}>{it.nome}</span>
              <span className={s.itemDropPath}>{it.grupo_nome}{it.subgrupo_nome ? ` › ${it.subgrupo_nome}` : ''}</span>
            </li>
          ))
        : query ? <li className={s.itemDropEmpty}>Nenhum item encontrado</li> : null
      }
    </ul>,
    document.body
  ) : null;

  return (
    <div className={s.carrinhoRow}>
      {/* Busca/seleção de item */}
      <div className={s.carrinhoItemCell} ref={ref}>
        {row.item ? (
          <div className={s.itemSelecionado}>
            <div className={s.itemSelBody}>
              <span className={s.itemSelNome}>{row.item.nome}</span>
              <span className={s.itemSelPath}>
                {row.item.grupo_nome}{row.item.subgrupo_nome ? ` › ${row.item.subgrupo_nome}` : ''}
              </span>
            </div>
            <button type="button" className={s.itemSelClear} onClick={limpar} title="Trocar item">✕</button>
          </div>
        ) : (
          <div className={s.itemSearch}>
            <div className={s.itemFiltros}>
              <select
                className={s.itemSubgrupoSelect}
                value={grupoFiltro}
                onChange={e => { setGrupoFiltro(e.target.value); setSubgrupoFiltro(''); abrirDrop(); }}
              >
                <option value="">Todos os grupos</option>
                {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
              </select>
              <select
                className={s.itemSubgrupoSelect}
                value={subgrupoFiltro}
                onChange={e => { setSubgrupoFiltro(e.target.value); abrirDrop(); }}
              >
                <option value="">Todos os subgrupos</option>
                {subgrupos.map(sg => <option key={sg.id} value={sg.id}>{sg.nome}</option>)}
              </select>
            </div>
            <input
              ref={inputRef}
              className={s.input}
              placeholder="Buscar item..."
              value={query}
              onChange={e => { setQuery(e.target.value); abrirDrop(); }}
              onFocus={abrirDrop}
              autoComplete="off"
            />
            {dropdown}
          </div>
        )}
      </div>

      {/* Valor */}
      <div className={s.carrinhoValorCell}>
        <div className={s.inputWrap}>
          <span className={s.inputPrefix}>R$</span>
          <CurrencyInput
            className={`${s.input} ${s.inputWithPrefix}`}
            value={row.valor}
            onChange={e => onChange({ ...row, valor: e.target.value })}
          />
        </div>
      </div>

      {/* Remover */}
      <button type="button" className={s.carrinhoRemove} onClick={onRemove} disabled={!canRemove} title="Remover">
        <IcoDelete />
      </button>
    </div>
  );
}

export default function DespesaPage() {
  const toast = useGlobalToast();
  const [tab, setTab] = useState('apagar');
  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}><IcoTotal /></div>
          <div>
            <h1 className={s.pageTitle}>Despesas</h1>
            <p className={s.pageSub}>Lançamentos financeiros e controle de pagamentos</p>
          </div>
        </div>
      </div>
      <TabBar tab={tab} setTab={setTab} />
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}>
          {tab === 'apagar'   && <TabAPagar   toast={toast} />}
          {tab === 'pagas'    && <TabPagas    toast={toast} />}
          {tab === 'analises' && <TabAnalises toast={toast} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══ TAB A PAGAR ══ */
function TabAPagar({ toast }) {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);

  /* Campos compartilhados (novo lançamento em lote) */
  const [shared, setShared] = useState(EMPTY_SHARED);
  /* Lista de itens do carrinho */
  const [carrinho, setCarrinho] = useState([{ ...EMPTY_ITEM_ROW, _key: newKey() }]);
  /* Formulário de edição de item único */
  const [editForm, setEditForm] = useState({});
  const [editItem, setEditItem] = useState(null); // item selecionado no modo edição

  const [grupos, setGrupos]             = useState([]);
  const [todosItens, setTodosItens]     = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [compradores, setCompradores]   = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [projetos, setProjetos]         = useState([]);
  const [contas, setContas]             = useState([]);

  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', grupo_id: '', fornecedor_id: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...Object.fromEntries(Object.entries(filtros).filter(([, v]) => v)), status: 'pendente' };
      setRows(await despesaService.getAll(params));
    } catch { toast?.error('Erro ao carregar despesas'); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { grupoDespesaService.getAll().then(setGrupos); }, []);
  useEffect(() => { fornecedorService.getAll().then(setFornecedores); }, []);

  useEffect(() => {
    if (modalOpen) {
      Promise.all([
        itemDespesaService.getAll(),
        fornecedorService.getAll(),
        compradorService.getAll(),
        centroCustoService.getAll(),
        projetoService.getAll(),
        contaService.getAll(),
      ]).then(([it, f, c, cc, p, ct]) => {
        setTodosItens(it); setFornecedores(f); setCompradores(c);
        setCentrosCusto(cc); setProjetos(p); setContas(ct);
      });
    }
  }, [modalOpen]);

  const setS = (k, v) => setShared(p => ({ ...p, [k]: v }));
  const setE = (k, v) => setEditForm(p => ({ ...p, [k]: v }));

  const openNew = () => {
    setEditing(null);
    setShared(EMPTY_SHARED);
    setCarrinho([{ ...EMPTY_ITEM_ROW, _key: newKey() }]);
    setModalOpen(true);
  };

  const openEdit = row => {
    setEditing(row);
    setEditForm({
      item_id: row.item_id || '', subgrupo_id: row.subgrupo_id || '',
      grupo_id: row.grupo_id || '', fornecedor_id: row.fornecedor_id || '',
      comprador_id: row.comprador_id || '', centro_custo_id: row.centro_custo_id || '',
      projeto_id: row.projeto_id || '', conta_id: row.conta_id || '',
      valor: row.valor || '', data: formatDateInput(row.data),
      descricao: row.descricao || '', status: row.status || 'pendente',
    });
    setEditItem(row.item_id ? { id: row.item_id, nome: row.item_nome || '', subgrupo_nome: row.subgrupo_nome || '', grupo_nome: row.grupo_nome || '' } : null);
    setModalOpen(true);
  };

  const addCarrinhoRow = () => setCarrinho(p => [...p, { ...EMPTY_ITEM_ROW, _key: newKey() }]);
  const removeCarrinhoRow = (key) => setCarrinho(p => p.filter(r => r._key !== key));
  const updateCarrinhoRow = (key, updated) => setCarrinho(p => p.map(r => r._key === key ? updated : r));

  /* Salva — modo novo (batch) ou edição (update único) */
  const handleSave = async e => {
    e.preventDefault();

    if (editing) {
      // Edição de item único
      if (!editForm.item_id) { toast?.error('Selecione um item'); return; }
      setSaving(true);
      try {
        await despesaService.update(editing.id, editForm);
        toast?.success('Despesa atualizada');
        setModalOpen(false); load();
      } catch (err) { toast?.error(err.response?.data?.message || 'Erro ao salvar'); }
      finally { setSaving(false); }
      return;
    }

    // Novo — batch: ignora linhas completamente vazias, valida as parcialmente preenchidas
    const preenchidas = carrinho.filter(r => r.item_id || (r.valor && Number(r.valor) > 0));
    if (preenchidas.length === 0) { toast?.error('Adicione pelo menos um item'); return; }
    const invalidos = preenchidas.filter(r => !r.item_id || !r.valor || Number(r.valor) <= 0);
    if (invalidos.length > 0) { toast?.error('Preencha item e valor em todas as linhas adicionadas'); return; }
    if (shared.status === 'pago' && !shared.conta_id) { toast?.error('Selecione a conta para despesa paga'); return; }
    if (!shared.data) { toast?.error('Informe a data'); return; }

    setSaving(true);
    try {
      await despesaService.createBatch({
        compartilhado: {
          fornecedor_id: shared.fornecedor_id || null,
          comprador_id: shared.comprador_id || null,
          centro_custo_id: shared.centro_custo_id || null,
          projeto_id: shared.projeto_id || null,
          conta_id: shared.conta_id,
          data: shared.data,
          descricao: shared.descricao || null,
          status: shared.status,
        },
        itens: preenchidas.map(r => {
          const valorBruto = Number(r.valor || 0);
          const proporcao  = subtotalCarrinho > 0 ? valorBruto / subtotalCarrinho : 0;
          const valorLiq   = +(valorBruto - descontoCarrinho * proporcao).toFixed(2);
          return { item_id: r.item_id, subgrupo_id: r.subgrupo_id, grupo_id: r.grupo_id, valor: valorLiq };
        }),
      });
      toast?.success(`${preenchidas.length} despesa(s) lançada(s)`);
      setModalOpen(false); load();
    } catch (err) { toast?.error(err.response?.data?.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await despesaService.remove(deleteTarget.id); toast?.success('Despesa excluída'); setDeleteTarget(null); load(); }
    catch { toast?.error('Erro ao excluir'); }
    finally { setDeleting(false); }
  };

  const [baixaTarget, setBaixaTarget]   = useState(null);
  const [baixaData, setBaixaData]       = useState('');
  const [baixaObs, setBaixaObs]         = useState('');
  const [baixaParcelas, setBaixaParcelas] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [baixando, setBaixando]         = useState(false);

  let _parcelaKey = useRef(0);
  const newParcelaKey = () => ++_parcelaKey.current;

  useEffect(() => {
    if (baixaTarget) {
      Promise.all([contaService.getAll(), import('../../services/formaPagamentoService').then(m => m.default.getAll())])
        .then(([cts, fps]) => { setContas(cts); setFormasPagamento(fps); });
    }
  }, [baixaTarget]);

  const openBaixa = (row) => {
    setBaixaTarget(row);
    setBaixaData(new Date().toISOString().slice(0, 10));
    setBaixaObs('');
    setBaixaParcelas([{ _key: newParcelaKey(), conta_id: '', forma_pagamento_id: '', valor: String(row.valor) }]);
  };

  const addBaixaParcela = () => {
    const pago = baixaParcelas.reduce((a, p) => a + Number(p.valor || 0), 0);
    const restante = Math.max(0, Number(baixaTarget?.valor || 0) - pago).toFixed(2);
    setBaixaParcelas(p => [...p, { _key: newParcelaKey(), conta_id: '', forma_pagamento_id: '', valor: restante }]);
  };

  const setBaixaParcela = (key, field, val) =>
    setBaixaParcelas(ps => ps.map(p => p._key === key ? { ...p, [field]: val } : p));

  const removeBaixaParcela = (key) =>
    setBaixaParcelas(ps => ps.filter(p => p._key !== key));

  const totalBaixaParcelas = baixaParcelas.reduce((a, p) => a + Number(p.valor || 0), 0);
  const diffBaixa = totalBaixaParcelas - Number(baixaTarget?.valor || 0);

  const handleBaixa = async (e) => {
    e.preventDefault();
    if (!baixaData) { toast?.error('Informe a data de pagamento'); return; }
    if (baixaParcelas.some(p => !p.conta_id)) { toast?.error('Selecione a conta em todas as parcelas'); return; }
    if (baixaParcelas.some(p => Number(p.valor) <= 0)) { toast?.error('Todas as parcelas precisam ter valor maior que zero'); return; }
    setBaixando(true);
    try {
      const parcelas = baixaParcelas.map(p => ({
        conta_id: p.conta_id,
        forma_pagamento_id: p.forma_pagamento_id || null,
        valor: p.valor,
        acrescimo: diffBaixa > 0 && baixaParcelas.length === 1 ? diffBaixa.toFixed(2) : 0,
        desconto:  diffBaixa < 0 && baixaParcelas.length === 1 ? Math.abs(diffBaixa).toFixed(2) : 0,
      }));
      await despesaService.baixar(baixaTarget.id, { parcelas, data_pagamento: baixaData, observacao: baixaObs });
      toast?.success('Pagamento registrado com sucesso');
      setBaixaTarget(null);
      load();
    } catch (err) { toast?.error(err.response?.data?.message || 'Erro ao registrar pagamento'); }
    finally { setBaixando(false); }
  };

  const temFiltro = Object.values(filtros).some(v => v);
  const subtotalCarrinho = carrinho.filter(r => r.item_id && r.valor).reduce((a, r) => a + Number(r.valor || 0), 0);
  const descontoCarrinho = Math.min(Number(shared.desconto || 0), subtotalCarrinho);
  const totalCarrinho    = subtotalCarrinho - descontoCarrinho;

  const columns = [
    { key: 'data',            label: 'Data',       width: 105, render: v => <span className={s.cellDate}>{formatDate(v)}</span> },
    { key: 'grupo_nome',      label: 'Grupo',      render: v => <span className={s.cellGrupo}>{v || '—'}</span> },
    { key: 'item_nome',       label: 'Item',       render: v => v || '—' },
    { key: 'fornecedor_nome', label: 'Fornecedor', render: v => v || '—' },
    { key: 'conta_numero',    label: 'Conta',      width: 110, render: v => v ? <span className={s.cellConta}>{v}</span> : '—' },
    { key: 'valor', label: 'Valor', width: 130, align: 'right',
      render: v => <span className={s.cellValor}>{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', width: 110, align: 'center',
      render: v => <span className={`${s.badge} ${v === 'pago' ? s.badgePago : s.badgePendente}`}>
        {v === 'pago' ? 'Pago' : 'Pendente'}
      </span> },
    { key: '_actions', label: '', width: 110, align: 'center',
      render: (_, row) => (
        <div className={s.actions}>
          <button className={s.btnBaixa}  onClick={() => openBaixa(row)}       title="Registrar pagamento"><IcoBaixa /></button>
          <button className={s.btnEdit}   onClick={() => openEdit(row)}         title="Editar"><IcoEdit /></button>
          <button className={s.btnDelete} onClick={() => setDeleteTarget(row)}  title="Excluir"><IcoDelete /></button>
        </div>
      )},
  ];

  /* ── Render dos selects de edição com item search ── */
  const EditItemSearch = () => {
    const [query, setQuery]       = useState('');
    const [dropOpen, setDropOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const h = e => { if (ref.current && !ref.current.contains(e.target)) setDropOpen(false); };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, []);

    const filtrados = todosItens.filter(it =>
      !query || it.nome.toLowerCase().includes(query.toLowerCase()) ||
      it.subgrupo_nome?.toLowerCase().includes(query.toLowerCase()) ||
      it.grupo_nome?.toLowerCase().includes(query.toLowerCase())
    );

    const selecionar = (item) => {
      setEditItem(item);
      setEditForm(p => ({ ...p, item_id: item.id, subgrupo_id: item.subgrupo_id, grupo_id: item.grupo_id }));
      setQuery(''); setDropOpen(false);
    };

    if (editItem) return (
      <div className={s.itemSelecionado}>
        <div className={s.itemSelBody}>
          <span className={s.itemSelNome}>{editItem.nome}</span>
          <span className={s.itemSelPath}>{editItem.grupo_nome}{editItem.subgrupo_nome ? ` › ${editItem.subgrupo_nome}` : ''}</span>
        </div>
        <button type="button" className={s.itemSelClear}
          onClick={() => { setEditItem(null); setEditForm(p => ({ ...p, item_id: '', subgrupo_id: '', grupo_id: '' })); }}>✕</button>
      </div>
    );

    return (
      <div className={s.itemSearch} ref={ref}>
        <input className={s.input} placeholder="Buscar item pelo nome..."
          value={query} onChange={e => { setQuery(e.target.value); setDropOpen(true); }}
          onFocus={() => setDropOpen(true)} autoComplete="off" />
        <AnimatePresence>
          {dropOpen && filtrados.length > 0 && (
            <motion.ul className={s.itemDropdown}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
              {filtrados.slice(0, 10).map(it => (
                <li key={it.id} className={s.itemDropItem} onMouseDown={() => selecionar(it)}>
                  <span className={s.itemDropNome}>{it.nome}</span>
                  <span className={s.itemDropPath}>{it.grupo_nome}{it.subgrupo_nome ? ` › ${it.subgrupo_nome}` : ''}</span>
                </li>
              ))}
            </motion.ul>
          )}
          {dropOpen && query && filtrados.length === 0 && (
            <motion.ul className={s.itemDropdown}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
              <li className={s.itemDropEmpty}>Nenhum item encontrado</li>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={s.tabContent}>

      {/* ── KPI Cards ── */}
      <div className={s.kpis}>
        {[
          { label: 'Total a Pagar', value: formatCurrency(rows.reduce((a, r) => a + Number(r.valor||0), 0)), icon: <IcoAPagar />, variant: 'pendente' },
          { label: 'Vencendo Hoje', value: formatCurrency(rows.filter(r => r.data === new Date().toISOString().slice(0,10)).reduce((a,r) => a + Number(r.valor||0), 0)), icon: <IcoPendente />, variant: 'pago' },
          { label: 'Lançamentos',   value: rows.length, icon: <IcoCount />, variant: 'count' },
        ].map((card, i) => (
          <motion.div key={card.label} className={`${s.kpi} ${s[`kpi_${card.variant}`]}`}
            custom={i} variants={cardVariants} initial="hidden" animate="visible">
            <div className={s.kpiBar} />
            <div className={s.kpiIcon}>{card.icon}</div>
            <div className={s.kpiBody}>
              <div className={s.kpiValue}>{card.value}</div>
              <div className={s.kpiLabel}>{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filter Bar + Nova Despesa ── */}
      <motion.div className={s.filterBar}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.25 }}>
        <div className={s.filterIcon}><IcoFilter /></div>
        <div className={s.filterGroup}>
          <DateInput className={s.filterInput} value={filtros.data_inicio}
            onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
          <span className={s.filterSep}>—</span>
          <DateInput className={s.filterInput} value={filtros.data_fim}
            onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
        </div>
        <select className={s.filterSelect} value={filtros.grupo_id}
          onChange={e => setFiltros(p => ({ ...p, grupo_id: e.target.value }))}>
          <option value="">Todos os grupos</option>
          {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
        </select>
        <select className={s.filterSelect} value={filtros.fornecedor_id}
          onChange={e => setFiltros(p => ({ ...p, fornecedor_id: e.target.value }))}>
          <option value="">Todos os fornecedores</option>
          {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
        <AnimatePresence>
          {temFiltro && (
            <motion.button className={s.clearBtn}
              onClick={() => setFiltros({ data_inicio: '', data_fim: '', grupo_id: '', fornecedor_id: '' })}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.15 }}>
              ✕ Limpar
            </motion.button>
          )}
        </AnimatePresence>
        <motion.button className={s.newBtn} onClick={openNew} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ marginLeft: 'auto' }}>
          <IcoPlus /> Nova Despesa
        </motion.button>
      </motion.div>

      {/* ── Table ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.28 }}>
        <DataTable columns={columns} data={rows} loading={loading} emptyMessage="Nenhuma despesa registrada" />
      </motion.div>

      {/* ══ MODAL ══ */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Despesa' : 'Nova Despesa'} width={600}>
        <form onSubmit={handleSave} className={s.form}>

          {editing ? (
            /* ── MODO EDIÇÃO — formulário simples ── */
            <>
              <div className={s.cascadeBox}>
                <div className={s.cascadeTitle}>Plano de Contas</div>
                <div className={s.field}>
                  <label className={s.label}>Item <span className={s.req}>*</span></label>
                  <EditItemSearch />
                </div>
              </div>

              <div className={s.grid2}>
                <div className={s.field}>
                  <label className={s.label}>Fornecedor</label>
                  <select className={s.select} value={editForm.fornecedor_id} onChange={e => setE('fornecedor_id', e.target.value)}>
                    <option value="">Nenhum</option>
                    {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Centro de Custo</label>
                  <select className={s.select} value={editForm.centro_custo_id} onChange={e => setE('centro_custo_id', e.target.value)}>
                    <option value="">Nenhum</option>
                    {centrosCusto.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className={s.grid2}>
                <div className={s.field}>
                  <label className={s.label}>Projeto</label>
                  <select className={s.select} value={editForm.projeto_id} onChange={e => setE('projeto_id', e.target.value)}>
                    <option value="">Nenhum</option>
                    {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Comprador</label>
                  <select className={s.select} value={editForm.comprador_id} onChange={e => setE('comprador_id', e.target.value)}>
                    <option value="">Nenhum</option>
                    {compradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className={s.grid2}>
                <div className={s.field}>
                  <label className={s.label}>Valor <span className={s.req}>*</span></label>
                  <div className={s.inputWrap}>
                    <span className={s.inputPrefix}>R$</span>
                    <CurrencyInput
                      className={`${s.input} ${s.inputWithPrefix}`}
                      value={editForm.valor} onChange={e => setE('valor', e.target.value)}
                      required />
                  </div>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Data de Previsão <span className={s.req}>*</span></label>
                  <DateInput className={s.input} value={editForm.data}
                    onChange={e => setE('data', e.target.value)} required />
                </div>
              </div>

              <div className={s.field}>
                <label className={s.label}>Conta <small style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(opcional — definida no pagamento)</small></label>
                <select className={s.select} value={editForm.conta_id} onChange={e => setE('conta_id', e.target.value)}>
                  <option value="">Nenhuma</option>
                  {contas.map(c => <option key={c.id} value={c.id}>{c.tipo === 'caixa' ? 'Caixa' : `${c.banco_nome || ''} — ${c.numero}`}</option>)}
                </select>
              </div>

              <div className={s.field}>
                <label className={s.label}>Observação</label>
                <textarea className={s.textarea} value={editForm.descricao}
                  onChange={e => setE('descricao', e.target.value)} rows={2}
                  placeholder="Observações adicionais..." />
              </div>
            </>
          ) : (
            /* ── MODO NOVO — carrinho multi-item ── */
            <>
              {/* Campos compartilhados */}
              <div className={s.sharedBox}>
                <div className={s.sharedTitle}>
                  <span className={s.modalSectionHeadDot} />
                  Dados Comuns
                </div>
                <div className={s.sharedBody}>
                  {/* 1. Status */}
                  <div className={s.field}>
                    <label className={s.label}>Status</label>
                    <div className={s.statusToggle}>
                      {[
                        { value: 'pendente', label: 'A Pagar', cls: s.togglePendente },
                        { value: 'pago',     label: 'Pago',    cls: s.togglePago     },
                      ].map(opt => (
                        <button key={opt.value} type="button"
                          className={`${s.toggleBtn} ${shared.status === opt.value ? `${opt.cls} ${s.toggleActive}` : ''}`}
                          onClick={() => { setS('status', opt.value); if (opt.value === 'pendente') setS('conta_id', ''); }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Data + Conta */}
                  <div className={s.grid2}>
                    <div className={s.field}>
                      <label className={s.label}>
                        {shared.status === 'pendente' ? 'Data de Previsão' : 'Data de Pagamento'}
                        <span className={s.req}>*</span>
                      </label>
                      <DateInput className={s.input} value={shared.data}
                        onChange={e => setS('data', e.target.value)} />
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>
                        Conta {shared.status === 'pago' ? <span className={s.req}>*</span> : <span className={s.labelHint}>opcional</span>}
                      </label>
                      <select className={s.select} value={shared.conta_id}
                        onChange={e => setS('conta_id', e.target.value)}
                        disabled={shared.status === 'pendente'}>
                        <option value="">{shared.status === 'pendente' ? '— A pagar —' : 'Selecione...'}</option>
                        {contas.map(c => <option key={c.id} value={c.id}>{c.tipo === 'caixa' ? 'Caixa' : `${c.banco_nome || ''} — ${c.numero}`}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* 3. Fornecedor + Centro de Custo */}
                  <div className={s.grid2}>
                    <div className={s.field}>
                      <label className={s.label}>Fornecedor</label>
                      <select className={s.select} value={shared.fornecedor_id} onChange={e => setS('fornecedor_id', e.target.value)}>
                        <option value="">Nenhum</option>
                        {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                      </select>
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>Centro de Custo</label>
                      <select className={s.select} value={shared.centro_custo_id} onChange={e => setS('centro_custo_id', e.target.value)}>
                        <option value="">Nenhum</option>
                        {centrosCusto.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* 4. Projeto */}
                  <div className={s.field}>
                    <label className={s.label}>Projeto</label>
                    <select className={s.select} value={shared.projeto_id} onChange={e => setS('projeto_id', e.target.value)}>
                      <option value="">Nenhum</option>
                      {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Carrinho de itens */}
              <div className={s.carrinhoBox}>
                <div className={s.carrinhoHeader}>
                  <span className={s.carrinhoTitle}>
                    <span className={s.modalSectionHeadDot} />
                    Itens da Despesa
                  </span>
                  {subtotalCarrinho > 0 && (
                    <div className={s.carrinhoTotais}>
                      {descontoCarrinho > 0 && <span className={s.carrinhoSubtotal}>Subtotal: {formatCurrency(subtotalCarrinho)}</span>}
                      {descontoCarrinho > 0 && <span className={s.carrinhoDesconto}>− {formatCurrency(descontoCarrinho)}</span>}
                      <span className={s.carrinhoTotal}>Total: <strong>{formatCurrency(totalCarrinho)}</strong></span>
                    </div>
                  )}
                </div>

                <div className={s.carrinhoLabels}>
                  <span>Item / Plano de Contas</span>
                  <span>Valor</span>
                  <span></span>
                </div>

                <AnimatePresence initial={false}>
                  {carrinho.map((row) => (
                    <motion.div key={row._key}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}>
                      <ItemSearchRow
                        row={row}
                        todosItens={todosItens}
                        onChange={updated => updateCarrinhoRow(row._key, updated)}
                        onRemove={() => removeCarrinhoRow(row._key)}
                        canRemove={carrinho.length > 1}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button type="button" className={s.addItemBtn} onClick={addCarrinhoRow}>
                  <IcoPlus /> Adicionar item
                </button>
              </div>

              <div className={s.grid2}>
                <div className={s.field}>
                  <label className={s.label}>Desconto <span className={s.labelHint}>opcional</span></label>
                  <div className={s.inputWrap}>
                    <span className={s.inputPrefix}>R$</span>
                    <CurrencyInput
                      className={`${s.input} ${s.inputWithPrefix}`}
                      value={shared.desconto}
                      onChange={e => setS('desconto', e.target.value)} />
                  </div>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Observação</label>
                  <textarea className={s.textarea} value={shared.descricao}
                    onChange={e => setS('descricao', e.target.value)} rows={2}
                    placeholder="Observações adicionais..." />
                </div>
              </div>
            </>
          )}

          <div className={s.formActions}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editing ? 'Salvar alterações' : `Lançar ${carrinho.length > 1 ? `${carrinho.length} despesas` : 'despesa'}`}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Excluir Despesa"
        message={`Excluir despesa de ${formatCurrency(deleteTarget?.valor)} em ${formatDate(deleteTarget?.data)}?`}
      />

      {/* ══ MODAL BAIXA ══ */}
      <Modal isOpen={!!baixaTarget} onClose={() => setBaixaTarget(null)} title="Registrar Pagamento" width={480}>
        {baixaTarget && (
          <form onSubmit={handleBaixa} className={s.form}>
            {/* Info da despesa */}
            <div className={s.baixaInfo}>
              <div className={s.baixaInfoItem}>
                <span className={s.baixaInfoLabel}>Despesa</span>
                <span className={s.baixaInfoVal}>{baixaTarget.item_nome || '—'}</span>
              </div>
              <div className={s.baixaInfoItem}>
                <span className={s.baixaInfoLabel}>Valor Original</span>
                <span className={s.baixaInfoVal}>{formatCurrency(baixaTarget.valor)}</span>
              </div>
            </div>

            {/* Data */}
            <div className={s.field}>
              <label className={s.label}>Data do Pagamento <span className={s.req}>*</span></label>
              <DateInput className={s.input} value={baixaData}
                onChange={e => setBaixaData(e.target.value)} required />
            </div>

            {/* Parcelas */}
            <div className={s.carrinhoBox}>
              <div className={s.carrinhoHeader}>
                <span className={s.carrinhoTitle}>
                  <span className={s.modalSectionHeadDot} />
                  Formas de Pagamento
                </span>
                {/* Totalizador */}
                <span className={diffBaixa > 0.005
                  ? s.baixaDiffPos
                  : diffBaixa < -0.005
                    ? s.baixaDiffNeg
                    : s.baixaDiffOk}>
                  {diffBaixa > 0.005
                    ? `+${formatCurrency(diffBaixa)} juros`
                    : diffBaixa < -0.005
                      ? `-${formatCurrency(Math.abs(diffBaixa))} desconto`
                      : '✓ Total ok'}
                </span>
              </div>

              {baixaParcelas.map((p, i) => (
                <div key={p._key} className={s.baixaParcelaRow}>
                  <select className={s.select} value={p.forma_pagamento_id}
                    onChange={e => setBaixaParcela(p._key, 'forma_pagamento_id', e.target.value)}>
                    <option value="">Forma (opcional)</option>
                    {formasPagamento.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                  <select className={s.select} value={p.conta_id}
                    onChange={e => setBaixaParcela(p._key, 'conta_id', e.target.value)} required>
                    <option value="">Conta *</option>
                    {contas.map(c => <option key={c.id} value={c.id}>{c.tipo === 'caixa' ? 'Caixa' : `${c.banco_nome || ''} — ${c.numero}`}</option>)}
                  </select>
                  <div className={s.inputWrap}>
                    <span className={s.inputPrefix}>R$</span>
                    <CurrencyInput className={`${s.input} ${s.inputWithPrefix}`}
                      value={p.valor}
                      onChange={e => setBaixaParcela(p._key, 'valor', e.target.value)} />
                  </div>
                  <button type="button" className={s.carrinhoRemove}
                    onClick={() => removeBaixaParcela(p._key)}
                    disabled={baixaParcelas.length === 1}>
                    <IcoDelete />
                  </button>
                </div>
              ))}

              <button type="button" className={s.addItemBtn} onClick={addBaixaParcela}>
                <IcoPlus /> Adicionar forma de pagamento
              </button>
            </div>

            <div className={s.field}>
              <label className={s.label}>Observação <span className={s.labelHint}>opcional</span></label>
              <textarea className={s.textarea} rows={2} placeholder="Ex: pago com desconto negociado..."
                value={baixaObs} onChange={e => setBaixaObs(e.target.value)} />
            </div>

            <div className={s.formActions}>
              <Button type="button" variant="secondary" onClick={() => setBaixaTarget(null)} disabled={baixando}>Cancelar</Button>
              <Button type="submit" variant="primary" loading={baixando}>Confirmar Pagamento</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ══ TAB PAGAS ══ */
function TabPagas({ toast }) {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', grupo_id: '', fornecedor_id: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...Object.fromEntries(Object.entries(filtros).filter(([, v]) => v)), status: 'pago' };
      setRows(await despesaService.getAll(params));
    } catch { toast?.error('Erro ao carregar despesas'); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { grupoDespesaService.getAll().then(setGrupos); }, []);
  useEffect(() => { fornecedorService.getAll().then(setFornecedores); }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try { await despesaService.remove(deleteTarget.id); toast?.success('Despesa excluída'); setDeleteTarget(null); load(); }
    catch { toast?.error('Erro ao excluir'); }
    finally { setDeleting(false); }
  };

  const total          = rows.reduce((a, r) => a + Number(r.valor_pago || r.valor || 0), 0);
  const totalJuros     = rows.reduce((a, r) => a + Number(r.acrescimo || 0), 0);
  const totalDescontos = rows.reduce((a, r) => a + Number(r.desconto_pagamento || 0), 0);
  const temFiltro = Object.values(filtros).some(v => v);

  const columns = [
    { key: 'data',            label: 'Data',       width: 105, render: v => <span className={s.cellDate}>{formatDate(v)}</span> },
    { key: 'grupo_nome',      label: 'Grupo',      render: v => <span className={s.cellGrupo}>{v || '—'}</span> },
    { key: 'item_nome',       label: 'Item',       render: v => v || '—' },
    { key: 'fornecedor_nome', label: 'Fornecedor', render: v => v || '—' },
    { key: 'conta_numero', label: 'Conta', width: 110, render: v => v ? <span className={s.cellConta}>{v}</span> : '—' },
    { key: 'data_pagamento', label: 'Dt. Pagamento', width: 115, render: v => v ? <span className={s.cellDate}>{formatDate(v)}</span> : '—' },
    { key: 'valor_pago', label: 'Valor Pago', width: 150, align: 'right',
      render: (v, row) => {
        const pago     = Number(v || row.valor || 0);
        const acres    = Number(row.acrescimo || 0);
        const desc     = Number(row.desconto_pagamento || 0);
        return (
          <div className={s.valorPagoCell}>
            <span className={s.cellValor}>{formatCurrency(pago)}</span>
            {acres > 0 && <span className={s.tagAcrescimo}>+{formatCurrency(acres)} juros</span>}
            {desc  > 0 && <span className={s.tagDesconto}>-{formatCurrency(desc)} desc</span>}
          </div>
        );
      }},
    { key: '_actions', label: '', width: 50, align: 'center',
      render: (_, row) => (
        <button className={s.btnDelete} onClick={() => setDeleteTarget(row)} title="Excluir"><IcoDelete /></button>
      )},
  ];

  return (
    <div className={s.tabContent}>
      <div className={s.kpis}>
        {[
          { label: 'Total Pago',    value: formatCurrency(total),         icon: <IcoPagas />,   variant: 'pago'     },
          { label: 'Total Juros',   value: formatCurrency(totalJuros),    icon: <IcoPendente />, variant: 'pendente' },
          { label: 'Total Descontos', value: formatCurrency(totalDescontos), icon: <IcoPago />,  variant: 'total'    },
          { label: 'Lançamentos',   value: rows.length,                   icon: <IcoCount />,   variant: 'count'    },
        ].map((card, i) => (
          <motion.div key={card.label} className={`${s.kpi} ${s[`kpi_${card.variant}`]}`}
            custom={i} variants={cardVariants} initial="hidden" animate="visible">
            <div className={s.kpiBar} />
            <div className={s.kpiIcon}>{card.icon}</div>
            <div className={s.kpiBody}>
              <div className={s.kpiValue}>{card.value}</div>
              <div className={s.kpiLabel}>{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div className={s.filterBar} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.25 }}>
        <div className={s.filterIcon}><IcoFilter /></div>
        <div className={s.filterGroup}>
          <DateInput className={s.filterInput} value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
          <span className={s.filterSep}>—</span>
          <DateInput className={s.filterInput} value={filtros.data_fim} onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
        </div>
        <select className={s.filterSelect} value={filtros.grupo_id} onChange={e => setFiltros(p => ({ ...p, grupo_id: e.target.value }))}>
          <option value="">Todos os grupos</option>
          {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
        </select>
        <select className={s.filterSelect} value={filtros.fornecedor_id} onChange={e => setFiltros(p => ({ ...p, fornecedor_id: e.target.value }))}>
          <option value="">Todos os fornecedores</option>
          {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
        <AnimatePresence>
          {temFiltro && (
            <motion.button className={s.clearBtn} onClick={() => setFiltros({ data_inicio: '', data_fim: '', grupo_id: '', fornecedor_id: '' })}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.15 }}>
              ✕ Limpar
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <DataTable columns={columns} data={rows} loading={loading} emptyMessage="Nenhuma despesa paga registrada" />

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="Excluir Despesa" message={`Excluir despesa de ${formatCurrency(deleteTarget?.valor)}?`} />
    </div>
  );
}

/* ══ TAB ANÁLISES ══ */
const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const APEX_COLORS = ['#1e3a5f','#2563eb','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

function TabAnalises({ toast }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      setRows(await despesaService.getAll(params));
    } catch { toast?.error('Erro ao carregar'); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { load(); }, [load]);

  const fmtBRL  = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const fmtPct  = (v) => (v === 0 ? '0%' : `${v > 0 ? '+' : ''}${v.toFixed(0)}%`);

  // ano detectado dos filtros ou do primeiro registro
  const anoAtivo = filtros.data_inicio
    ? filtros.data_inicio.slice(0, 4)
    : (rows[0]?.data?.slice(0, 4) || new Date().getFullYear().toString());

  // helpers
  const mesIdx = (r) => r.data ? parseInt(r.data.slice(5, 7), 10) - 1 : -1;
  const val    = (r) => Number(r.valor || 0);

  // ── Totais KPI ──
  const totalPago     = rows.filter(r => r.status === 'pago').reduce((a, r) => a + val(r), 0);
  const totalPendente = rows.filter(r => r.status !== 'pago').reduce((a, r) => a + val(r), 0);
  const totalGeral    = totalPago + totalPendente;

  // ── Tabela matriz grupos × meses ──
  const gruposMap = {};
  rows.forEach(r => {
    const g = r.grupo_nome || 'Sem grupo';
    const m = mesIdx(r);
    if (m < 0) return;
    if (!gruposMap[g]) gruposMap[g] = { nome: g, meses: Array(12).fill(0) };
    gruposMap[g].meses[m] += val(r);
  });
  const gruposList = Object.values(gruposMap).sort((a, b) => b.meses.reduce((s,v)=>s+v,0) - a.meses.reduce((s,v)=>s+v,0));
  const totaisMes  = MESES.map((_, i) => gruposList.reduce((s, g) => s + g.meses[i], 0));
  const totalMedia = totalGeral / 12;

  // crescimento mês a mês (total)
  const crescimento = MESES.map((_, i) => {
    if (i === 0) return 0;
    const ant = totaisMes[i - 1];
    if (ant === 0) return totaisMes[i] > 0 ? 100 : 0;
    return ((totaisMes[i] - ant) / ant) * 100;
  });

  // ── Tabela fornecedores × meses ──
  const fornMap = {};
  rows.forEach(r => {
    const f = r.fornecedor_nome || r.comprador_nome || 'Não informado';
    const m = mesIdx(r);
    if (m < 0) return;
    if (!fornMap[f]) fornMap[f] = { nome: f, meses: Array(12).fill(0) };
    fornMap[f].meses[m] += val(r);
  });
  const fornList = Object.values(fornMap).sort((a, b) => b.meses.reduce((s,v)=>s+v,0) - a.meses.reduce((s,v)=>s+v,0));
  const fornTotaisMes = MESES.map((_, i) => fornList.reduce((s, f) => s + f.meses[i], 0));

  // ── Donut grupos ──
  const donutGrupoOpts = {
    chart: { type: 'donut', background: 'transparent', fontFamily: 'inherit', animations: { speed: 600 } },
    colors: APEX_COLORS,
    labels: gruposList.map(g => g.nome),
    dataLabels: { enabled: false },
    legend: {
      position: 'right', fontSize: '11px',
      labels: { colors: '#cbd5e1' },
      markers: { radius: 3 },
      formatter: (name, opts) => {
        const v = opts.w.globals.series[opts.seriesIndex];
        const pct = totalGeral ? ((v / totalGeral) * 100).toFixed(1) : 0;
        return `${name} — ${pct}%`;
      },
    },
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total', color: '#94a3b8', fontSize: '11px', formatter: w => `R$ ${fmtBRL(w.globals.seriesTotals.reduce((a,b)=>a+b,0))}` } } } } },
    stroke: { show: false },
    tooltip: { theme: 'dark', y: { formatter: v => `R$ ${fmtBRL(v)}` } },
  };
  const donutGrupoSeries = gruposList.map(g => g.meses.reduce((s,v)=>s+v,0));

  // ── Donut participação (% por grupo do total) ──
  const donutPctOpts = {
    ...donutGrupoOpts,
    legend: {
      ...donutGrupoOpts.legend,
      formatter: (name, opts) => {
        const v = opts.w.globals.series[opts.seriesIndex];
        const pct = totalGeral ? ((v / totalGeral) * 100).toFixed(1) : 0;
        return `${name}  ${pct}%`;
      },
    },
    tooltip: { theme: 'dark', y: { formatter: (v) => `${totalGeral ? ((v/totalGeral)*100).toFixed(1) : 0}%` } },
  };

  // ── AreaChart evolução mensal ──
  const mesesComDados = MESES.filter((_, i) => totaisMes[i] > 0);
  const areaOpts = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', fontFamily: 'inherit', animations: { speed: 600 }, zoom: { enabled: false } },
    colors: ['#2563eb', '#10b981'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 100] } },
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: MESES,
      labels: { style: { colors: '#94a3b8', fontSize: '10px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { formatter: v => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`, style: { colors: '#94a3b8', fontSize: '10px' } } },
    grid: { borderColor: '#1e293b', strokeDashArray: 3 },
    legend: { position: 'top', horizontalAlign: 'left', labels: { colors: '#94a3b8' }, markers: { radius: 3 } },
    tooltip: { theme: 'dark', y: { formatter: v => `R$ ${fmtBRL(v)}` } },
  };
  const areaSeries = [
    { name: 'Total Despesas', data: totaisMes },
    { name: 'Pago', data: MESES.map((_, i) => rows.filter(r => r.status === 'pago' && mesIdx(r) === i).reduce((s,r) => s+val(r), 0)) },
  ];

  const filtroBadge = filtros.data_inicio && filtros.data_fim
    ? `${filtros.data_inicio} a ${filtros.data_fim}`
    : filtros.data_inicio ? `A partir de ${filtros.data_inicio}`
    : filtros.data_fim   ? `Até ${filtros.data_fim}`
    : `Exercício ${anoAtivo}`;

  return (
    <div className={s.tabContent}>
      {/* KPIs */}
      <div className={s.kpis}>
        {[
          { label: 'Total Geral',   value: formatCurrency(totalGeral),    icon: <IcoTotal />,  variant: 'total'    },
          { label: 'Total Pago',    value: formatCurrency(totalPago),     icon: <IcoPagas />,  variant: 'pago'     },
          { label: 'Total a Pagar', value: formatCurrency(totalPendente), icon: <IcoAPagar />, variant: 'pendente' },
          { label: 'Lançamentos',   value: rows.length,                   icon: <IcoCount />,  variant: 'count'    },
        ].map((card, i) => (
          <motion.div key={card.label} className={`${s.kpi} ${s[`kpi_${card.variant}`]}`}
            custom={i} variants={cardVariants} initial="hidden" animate="visible">
            <div className={s.kpiBar} />
            <div className={s.kpiIcon}>{card.icon}</div>
            <div className={s.kpiBody}>
              <div className={s.kpiValue}>{card.value}</div>
              <div className={s.kpiLabel}>{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtro */}
      <motion.div className={s.filterBar} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.25 }}>
        <div className={s.filterIcon}><IcoFilter /></div>
        <div className={s.filterGroup}>
          <DateInput className={s.filterInput} value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
          <span className={s.filterSep}>—</span>
          <DateInput className={s.filterInput} value={filtros.data_fim} onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
        </div>
        <AnimatePresence>
          {Object.values(filtros).some(v => v) && (
            <motion.button className={s.clearBtn} onClick={() => setFiltros({ data_inicio: '', data_fim: '' })}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}>
              ✕ Limpar
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {loading ? (
        <div className={s.emptyState}>Carregando...</div>
      ) : gruposList.length === 0 ? (
        <div className={s.emptyState}>Nenhum dado para exibir</div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

          {/* ── TABELA MATRIZ GRUPOS × MESES ── */}
          <div className={s.rptBlock}>
            <div className={s.rptHeader}>
              <div className={s.rptHeaderLeft}>
                <IcoAnalise />
                <div>
                  <div className={s.rptTitle}>Despesas por Grupo</div>
                  <div className={s.rptSub}>Detalhado por grupo — competência {anoAtivo}</div>
                </div>
              </div>
              <div className={s.rptBadge}>FILTROS: {filtroBadge}</div>
            </div>

            <div className={s.rptTableWrap}>
              <table className={s.rptTable}>
                <thead>
                  <tr>
                    <th className={s.rptThDesc}>DESCRIÇÃO</th>
                    {MESES.map(m => <th key={m} className={s.rptTh}>{m}</th>)}
                    <th className={s.rptThTotal}>TOTAL</th>
                    <th className={s.rptThMedia}>MÉDIA</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Linha total geral */}
                  <tr className={s.rptRowTotal}>
                    <td className={s.rptTdDesc}>TOTAL DESPESAS</td>
                    {totaisMes.map((v, i) => (
                      <td key={i} className={s.rptTd}>{v > 0 ? fmtBRL(v) : '—'}</td>
                    ))}
                    <td className={s.rptTdTotal}>{fmtBRL(totalGeral)}</td>
                    <td className={s.rptTdMedia}>{fmtBRL(totalMedia)}</td>
                  </tr>
                  {/* Linhas por grupo */}
                  {gruposList.map((g, gi) => {
                    const tot = g.meses.reduce((s,v)=>s+v,0);
                    const med = tot / 12;
                    return (
                      <tr key={g.nome} className={gi % 2 === 0 ? s.rptRowEven : s.rptRowOdd}>
                        <td className={s.rptTdDescGrupo}>
                          <span className={s.rptGrupoBar} style={{ background: APEX_COLORS[gi % APEX_COLORS.length] }} />
                          {g.nome}
                        </td>
                        {g.meses.map((v, i) => (
                          <td key={i} className={s.rptTd}>{v > 0 ? fmtBRL(v) : '—'}</td>
                        ))}
                        <td className={s.rptTdTotal} style={{ color: APEX_COLORS[gi % APEX_COLORS.length] }}>{fmtBRL(tot)}</td>
                        <td className={s.rptTdMedia} style={{ color: APEX_COLORS[gi % APEX_COLORS.length] }}>{fmtBRL(med)}</td>
                      </tr>
                    );
                  })}
                  {/* Linha crescimento */}
                  <tr className={s.rptRowCrescLabel}>
                    <td className={s.rptTdDesc}>CRESCIMENTO</td>
                    {crescimento.map((v, i) => (
                      <td key={i} className={`${s.rptTd} ${v < 0 ? s.rptNeg : v > 0 ? s.rptPos : ''}`}>
                        {totaisMes[i] > 0 || totaisMes[i-1] > 0 ? fmtPct(v) : '—'}
                      </td>
                    ))}
                    <td className={s.rptTdTotal} />
                    <td className={s.rptTdMedia} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── GRÁFICOS LADO A LADO ── */}
          <div className={s.rptChartRow}>
            <div className={s.rptChartBlock}>
              <div className={s.rptChartHeader}>
                <span>Despesas por Grupo</span>
                <span className={s.rptChartSub}>Top {gruposList.length} · R$ {fmtBRL(totalGeral)}</span>
              </div>
              <ReactApexChart key={`dg-${gruposList.length}`} type="donut" options={donutGrupoOpts} series={donutGrupoSeries} height={260} />
            </div>
            <div className={s.rptChartBlock}>
              <div className={s.rptChartHeader}>
                <span>(%) Participação nas Despesas</span>
              </div>
              <ReactApexChart key={`dp-${gruposList.length}`} type="donut" options={donutPctOpts} series={donutGrupoSeries} height={260} />
            </div>
          </div>

          {/* ── TABELA FORNECEDORES × MESES ── */}
          {fornList.length > 0 && (
            <div className={s.rptBlock}>
              <div className={s.rptHeader}>
                <div className={s.rptHeaderLeft}>
                  <IcoCount />
                  <div>
                    <div className={s.rptTitle}>Fornecedor por Mês — Despesas</div>
                    <div className={s.rptSub}>{fornList.length} fornecedores · Total R$ {fmtBRL(totalGeral)}</div>
                  </div>
                </div>
              </div>
              <div className={s.rptTableWrap}>
                <table className={s.rptTable}>
                  <thead>
                    <tr>
                      <th className={s.rptThDesc}>FORNECEDOR</th>
                      {MESES.map(m => <th key={m} className={s.rptTh}>{m}</th>)}
                      <th className={s.rptThTotal}>TOTAL</th>
                      <th className={s.rptThMedia}>MÉDIA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fornList.map((f, fi) => {
                      const tot = f.meses.reduce((s,v)=>s+v,0);
                      const med = tot / 12;
                      const maxMes = Math.max(...fornTotaisMes, 1);
                      return (
                        <tr key={f.nome} className={fi % 2 === 0 ? s.rptRowEven : s.rptRowOdd}>
                          <td className={s.rptTdDescForn}>
                            <div className={s.rptFornBar} style={{ width: `${(tot/fornList[0].meses.reduce((s,v)=>s+v,0))*100}%` }} />
                            {f.nome}
                          </td>
                          {f.meses.map((v, i) => (
                            <td key={i} className={s.rptTd}>{v > 0 ? `R$ ${fmtBRL(v)}` : '—'}</td>
                          ))}
                          <td className={s.rptTdTotal}>R$ {fmtBRL(tot)}</td>
                          <td className={s.rptTdMedia}>R$ {fmtBRL(med)}</td>
                        </tr>
                      );
                    })}
                    <tr className={s.rptRowTotal}>
                      <td className={s.rptTdDesc}>TOTAL GERAL</td>
                      {fornTotaisMes.map((v, i) => (
                        <td key={i} className={s.rptTd}>{v > 0 ? `R$ ${fmtBRL(v)}` : '—'}</td>
                      ))}
                      <td className={s.rptTdTotal}>R$ {fmtBRL(totalGeral)}</td>
                      <td className={s.rptTdMedia}>R$ {fmtBRL(totalGeral)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── AREA CHART EVOLUÇÃO ── */}
          <div className={s.rptBlock}>
            <div className={s.rptHeader}>
              <div className={s.rptHeaderLeft}>
                <IcoAnalise />
                <div>
                  <div className={s.rptTitle}>Evolução das Despesas</div>
                  <div className={s.rptSub}>Acumulado mensal — {anoAtivo}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              <ReactApexChart key={`area-${rows.length}`} type="area" options={areaOpts} series={areaSeries} height={220} />
            </div>
          </div>

        </motion.div>
      )}
    </div>
  );
}
