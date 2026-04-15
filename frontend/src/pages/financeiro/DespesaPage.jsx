import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import despesaService from '../../services/despesaService';
import grupoDespesaService from '../../services/grupoDespesaService';
import itemDespesaService from '../../services/itemDespesaService';
import fornecedorService from '../../services/fornecedorService';
import compradorService from '../../services/compradorService';
import centroCustoService from '../../services/centroCustoService';
import projetoService from '../../services/projetoService';
import contaService from '../../services/contaService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DataTable from '../../components/shared/DataTable';
import { useGlobalToast } from '../../components/layout/MainLayout';
import { formatCurrency, formatDate, formatDateInput } from '../../utils/formatters';
import s from './DespesaPage.module.css';

/* Campos compartilhados entre todos os itens do lote */
const EMPTY_SHARED = {
  fornecedor_id: '', comprador_id: '', centro_custo_id: '',
  projeto_id: '', conta_id: '', data: '', descricao: '', status: 'pendente',
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] } }),
};

let _keyCounter = 1;
const newKey = () => ++_keyCounter;

/* ── ItemSearchRow — linha do carrinho com busca de item ── */
function ItemSearchRow({ row, todosItens, onChange, onRemove, canRemove }) {
  const [query, setQuery]       = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const [dropPos, setDropPos]   = useState({ top: 0, left: 0, width: 0 });
  const ref     = useRef(null);
  const inputRef = useRef(null);

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

  const dropdown = (
    <AnimatePresence>
      {dropOpen && filtrados.length > 0 && createPortal(
        <motion.ul
          className={s.itemDropdown}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
          {filtrados.slice(0, 10).map(it => (
            <li key={it.id} className={s.itemDropItem} onMouseDown={() => selecionar(it)}>
              <span className={s.itemDropNome}>{it.nome}</span>
              <span className={s.itemDropPath}>{it.grupo_nome}{it.subgrupo_nome ? ` › ${it.subgrupo_nome}` : ''}</span>
            </li>
          ))}
        </motion.ul>,
        document.body
      )}
      {dropOpen && query && filtrados.length === 0 && createPortal(
        <motion.ul
          className={s.itemDropdown}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
          <li className={s.itemDropEmpty}>Nenhum item encontrado</li>
        </motion.ul>,
        document.body
      )}
    </AnimatePresence>
  );

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
          <input type="number" step="0.01" min="0.01"
            className={`${s.input} ${s.inputWithPrefix}`}
            value={row.valor}
            onChange={e => onChange({ ...row, valor: e.target.value })}
            placeholder="0,00"
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
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);   // linha única para edição
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

  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', status: '', grupo_id: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      setRows(await despesaService.getAll(params));
    } catch { toast?.error('Erro ao carregar despesas'); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { grupoDespesaService.getAll().then(setGrupos); }, []);

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

    // Novo — batch
    const invalidos = carrinho.filter(r => !r.item_id || !r.valor || Number(r.valor) <= 0);
    if (invalidos.length > 0) { toast?.error('Preencha item e valor em todas as linhas'); return; }
    if (shared.status === 'pago' && !shared.conta_id) { toast?.error('Selecione a conta para despesa paga'); return; }
    if (!shared.data)         { toast?.error('Informe a data'); return; }

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
        itens: carrinho.map(r => ({
          item_id: r.item_id, subgrupo_id: r.subgrupo_id,
          grupo_id: r.grupo_id, valor: r.valor,
        })),
      });
      toast?.success(`${carrinho.length} despesa(s) lançada(s)`);
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

  const temFiltro = Object.values(filtros).some(v => v);
  const totalPago     = rows.filter(r => r.status === 'pago').reduce((a, r) => a + Number(r.valor || 0), 0);
  const totalPendente = rows.filter(r => r.status === 'pendente').reduce((a, r) => a + Number(r.valor || 0), 0);
  const totalGeral    = rows.reduce((a, r) => a + Number(r.valor || 0), 0);

  const totalCarrinho = carrinho.reduce((a, r) => a + Number(r.valor || 0), 0);

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
    { key: '_actions', label: '', width: 80, align: 'center',
      render: (_, row) => (
        <div className={s.actions}>
          <button className={s.btnEdit}   onClick={() => openEdit(row)}        title="Editar"><IcoEdit /></button>
          <button className={s.btnDelete} onClick={() => setDeleteTarget(row)} title="Excluir"><IcoDelete /></button>
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
    <div className={s.page}>

      {/* ── Header ── */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}><IcoTotal /></div>
          <div>
            <h1 className={s.pageTitle}>Despesas</h1>
            <p className={s.pageSub}>Lançamentos financeiros e controle de pagamentos</p>
          </div>
        </div>
        <motion.button className={s.newBtn} onClick={openNew} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <IcoPlus /> Nova Despesa
        </motion.button>
      </div>

      {/* ── KPI Cards ── */}
      <div className={s.kpis}>
        {[
          { label: 'Total Pago',     value: formatCurrency(totalPago),     icon: <IcoPago />,     variant: 'pago'     },
          { label: 'Total a Pagar',  value: formatCurrency(totalPendente), icon: <IcoPendente />, variant: 'pendente' },
          { label: 'Total Geral',    value: formatCurrency(totalGeral),    icon: <IcoTotal />,    variant: 'total'    },
          { label: 'Lançamentos',    value: rows.length,                   icon: <IcoCount />,    variant: 'count'    },
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

      {/* ── Filter Bar ── */}
      <motion.div className={s.filterBar}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.25 }}>
        <div className={s.filterIcon}><IcoFilter /></div>
        <div className={s.filterGroup}>
          <input type="date" className={s.filterInput} value={filtros.data_inicio}
            onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
          <span className={s.filterSep}>—</span>
          <input type="date" className={s.filterInput} value={filtros.data_fim}
            onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
        </div>
        <select className={s.filterSelect} value={filtros.status}
          onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}>
          <option value="">Todos os status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
        </select>
        <select className={s.filterSelect} value={filtros.grupo_id}
          onChange={e => setFiltros(p => ({ ...p, grupo_id: e.target.value }))}>
          <option value="">Todos os grupos</option>
          {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
        </select>
        <AnimatePresence>
          {temFiltro && (
            <motion.button className={s.clearBtn}
              onClick={() => setFiltros({ data_inicio: '', data_fim: '', status: '', grupo_id: '' })}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.15 }}>
              ✕ Limpar
            </motion.button>
          )}
        </AnimatePresence>
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
                  <label className={s.label}>Conta <span className={s.req}>*</span></label>
                  <select className={s.select} value={editForm.conta_id} onChange={e => setE('conta_id', e.target.value)} required>
                    <option value="">Selecione...</option>
                    {contas.map(c => <option key={c.id} value={c.id}>{c.tipo === 'caixa' ? 'Caixa' : `${c.banco_nome || ''} — ${c.numero}`}</option>)}
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Status</label>
                  <div className={s.statusToggle}>
                    {[{ value: 'pendente', label: 'Pendente', cls: s.togglePendente }, { value: 'pago', label: 'Pago', cls: s.togglePago }].map(opt => (
                      <button key={opt.value} type="button"
                        className={`${s.toggleBtn} ${editForm.status === opt.value ? `${opt.cls} ${s.toggleActive}` : ''}`}
                        onClick={() => setE('status', opt.value)}>{opt.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={s.grid2}>
                <div className={s.field}>
                  <label className={s.label}>Valor <span className={s.req}>*</span></label>
                  <div className={s.inputWrap}>
                    <span className={s.inputPrefix}>R$</span>
                    <input type="number" step="0.01" min="0.01"
                      className={`${s.input} ${s.inputWithPrefix}`}
                      value={editForm.valor} onChange={e => setE('valor', e.target.value)}
                      placeholder="0,00" required />
                  </div>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Data <span className={s.req}>*</span></label>
                  <input type="date" className={s.input} value={editForm.data}
                    onChange={e => setE('data', e.target.value)} required />
                </div>
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
                <div className={s.sharedTitle}>Dados Comuns</div>

                {/* 1. Status — primeiro */}
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
                    <input type="date" className={s.input} value={shared.data}
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

              {/* Carrinho de itens */}
              <div className={s.carrinhoBox}>
                <div className={s.carrinhoHeader}>
                  <span className={s.carrinhoTitle}>Itens da Despesa</span>
                  {carrinho.length > 1 && (
                    <span className={s.carrinhoTotal}>
                      Total: <strong>{formatCurrency(totalCarrinho)}</strong>
                    </span>
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

              <div className={s.field}>
                <label className={s.label}>Observação</label>
                <textarea className={s.textarea} value={shared.descricao}
                  onChange={e => setS('descricao', e.target.value)} rows={2}
                  placeholder="Observações adicionais..." />
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
    </div>
  );
}
