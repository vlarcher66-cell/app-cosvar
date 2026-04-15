import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import receitaService from '../../services/receitaService';
import categoriaReceitaService from '../../services/categoriaReceitaService';
import descricaoReceitaService from '../../services/descricaoReceitaService';
import contaService from '../../services/contaService';
import projetoService from '../../services/projetoService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DataTable from '../../components/shared/DataTable';
import { useGlobalToast } from '../../components/layout/MainLayout';
import { formatCurrency, formatDate, formatDateInput } from '../../utils/formatters';
import s from './ReceitaPage.module.css';

const EMPTY = {
  categoria_id: '', descricao_id: '', conta_id: '',
  projeto_id: '', valor: '', data: '', descricao: '', status: 'pendente',
};

/* ── Ícones inline ── */
const IcoRecebido  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IcoPendente  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoTotal     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcoCount     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IcoEdit      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoDelete    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoPlus      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoFilter    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const IcoView      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] } }),
};

export default function ReceitaPage() {
  const toast = useGlobalToast();
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [form, setForm]           = useState(EMPTY);

  const [categorias, setCategorias] = useState([]);
  const [descricoes, setDescricoes] = useState([]);
  const [contas, setContas]         = useState([]);
  const [projetos, setProjetos]     = useState([]);

  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', status: '', categoria_id: '' });
  const [processo, setProcesso]       = useState(null);
  const [loadingProcesso, setLoadingProcesso] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      setRows(await receitaService.getAll(params));
    } catch { toast?.error('Erro ao carregar receitas'); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (modalOpen) {
      Promise.all([
        categoriaReceitaService.getAll(),
        contaService.getAll(),
        projetoService.getAll(),
      ]).then(([c, ct, p]) => { setCategorias(c); setContas(ct); setProjetos(p); });
    }
  }, [modalOpen]);

  // Carrega categorias para o filtro
  useEffect(() => {
    categoriaReceitaService.getAll().then(setCategorias);
  }, []);

  // Cascade categoria → descrição
  useEffect(() => {
    if (form.categoria_id) {
      descricaoReceitaService.getByCategoria(form.categoria_id).then(setDescricoes);
      setForm(p => ({ ...p, descricao_id: '' }));
    } else { setDescricoes([]); }
  }, [form.categoria_id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = row => {
    setEditing(row);
    setForm({
      categoria_id: row.categoria_id || '', descricao_id: row.descricao_id || '',
      conta_id: row.conta_id || '', projeto_id: row.projeto_id || '',
      valor: row.valor || '', data: formatDateInput(row.data),
      descricao: row.descricao || '', status: row.status || 'pendente',
    });
    setModalOpen(true);
  };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await receitaService.update(editing.id, form); toast?.success('Receita atualizada'); }
      else         { await receitaService.create(form); toast?.success('Receita lançada'); }
      setModalOpen(false); load();
    } catch (err) { toast?.error(err.response?.data?.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await receitaService.remove(deleteTarget.id); toast?.success('Receita excluída'); setDeleteTarget(null); load(); }
    catch { toast?.error('Erro ao excluir'); }
    finally { setDeleting(false); }
  };

  const openProcesso = async (cacau_baixa_id) => {
    if (loadingProcesso) return;
    setLoadingProcesso(true); setProcesso(null);
    try { setProcesso(await receitaService.getProcesso(cacau_baixa_id)); }
    catch (err) { toast?.error(err.response?.data?.message || 'Erro ao carregar processo'); }
    finally { setLoadingProcesso(false); }
  };

  const temFiltro = Object.values(filtros).some(v => v);

  // KPIs calculados do lado do cliente
  const totalRecebido = rows.filter(r => r.status === 'recebido').reduce((a, r) => a + Number(r.valor || 0), 0);
  const totalPendente = rows.filter(r => r.status === 'pendente').reduce((a, r) => a + Number(r.valor || 0), 0);
  const totalGeral    = rows.reduce((a, r) => a + Number(r.valor || 0), 0);

  const columns = [
    { key: 'data',           label: 'Data',      width: 105, render: v => <span className={s.cellDate}>{formatDate(v)}</span> },
    { key: '_origem', label: 'Origem', width: 150,
      render: (_, row) => row.cacau_baixa_id
        ? <span className={s.cellVinculada} title="Gerada automaticamente pela venda de cacau">🔒 {row.cacau_venda_numero || 'Cacau'}</span>
        : <span className={s.cellOrigemManual}>Manual</span> },
    { key: 'categoria_nome', label: 'Categoria', render: v => <span className={s.cellCategoria}>{v || '—'}</span> },
    { key: 'descricao_nome', label: 'Descrição', render: v => v || '—' },
    { key: 'conta_numero',         label: 'Conta',  width: 120, render: v => v ? <span className={s.cellConta}>{v}</span> : '—' },
    { key: 'forma_pagamento_nome', label: 'Forma',  width: 110, render: v => v ? <span className={s.cellForma}>{v}</span> : <span className={s.cellVazio}>—</span> },
    { key: 'valor', label: 'Valor', width: 130, align: 'right',
      render: v => <span className={s.cellValor}>{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', width: 120, align: 'center',
      render: v => <span className={`${s.badge} ${v === 'recebido' ? s.badgeRecebido : s.badgePendente}`}>
        {v === 'recebido' ? 'Recebido' : 'Pendente'}
      </span> },
    { key: '_actions', label: 'Ações', width: 80, align: 'center',
      render: (_, row) => row.cacau_baixa_id ? (
        <button className={s.btnView} onClick={e => { e.stopPropagation(); openProcesso(row.cacau_baixa_id); }} title="Ver processo">
          <IcoView />
        </button>
      ) : (
        <div className={s.actions}>
          <button className={s.btnEdit}   onClick={() => openEdit(row)}        title="Editar"><IcoEdit /></button>
          <button className={s.btnDelete} onClick={() => setDeleteTarget(row)} title="Excluir"><IcoDelete /></button>
        </div>
      )},
  ];

  return (
    <div className={s.page}>

      {/* ── Header ── */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}><IcoTotal /></div>
          <div>
            <h1 className={s.pageTitle}>Receitas</h1>
            <p className={s.pageSub}>Lançamentos financeiros e controle de recebimentos</p>
          </div>
        </div>
        <motion.button
          className={s.newBtn}
          onClick={openNew}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <IcoPlus />
          Nova Receita
        </motion.button>
      </div>

      {/* ── KPI Cards ── */}
      <div className={s.kpis}>
        {[
          { label: 'Total Recebido',    value: formatCurrency(totalRecebido), icon: <IcoRecebido />, variant: 'recebido' },
          { label: 'Total Pendente',    value: formatCurrency(totalPendente), icon: <IcoPendente />, variant: 'pendente' },
          { label: 'Total Geral',       value: formatCurrency(totalGeral),    icon: <IcoTotal />,    variant: 'total'    },
          { label: 'Lançamentos',       value: rows.length,                   icon: <IcoCount />,    variant: 'count'    },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            className={`${s.kpi} ${s[`kpi_${card.variant}`]}`}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
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
      <motion.div
        className={s.filterBar}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.25 }}
      >
        <div className={s.filterIcon}><IcoFilter /></div>
        <div className={s.filterGroup}>
          <input
            type="date" className={s.filterInput}
            value={filtros.data_inicio}
            onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))}
          />
          <span className={s.filterSep}>—</span>
          <input
            type="date" className={s.filterInput}
            value={filtros.data_fim}
            onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))}
          />
        </div>
        <select
          className={s.filterSelect}
          value={filtros.status}
          onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}
        >
          <option value="">Todos os status</option>
          <option value="recebido">Recebido</option>
          <option value="pendente">Pendente</option>
        </select>
        <select
          className={s.filterSelect}
          value={filtros.categoria_id}
          onChange={e => setFiltros(p => ({ ...p, categoria_id: e.target.value }))}
        >
          <option value="">Todas as categorias</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <AnimatePresence>
          {temFiltro && (
            <motion.button
              className={s.clearBtn}
              onClick={() => setFiltros({ data_inicio: '', data_fim: '', status: '', categoria_id: '' })}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
            >
              ✕ Limpar
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.28 }}
      >
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyMessage="Nenhuma receita registrada"
        />
      </motion.div>

      {/* ── Modal Nova/Editar ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Receita' : 'Nova Receita'}
        width={520}
      >
        <form onSubmit={handleSave} className={s.form}>
          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Categoria <span className={s.req}>*</span></label>
              <select className={s.select} value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} required>
                <option value="">Selecione...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>Descrição <span className={s.req}>*</span></label>
              <select className={s.select} value={form.descricao_id} onChange={e => set('descricao_id', e.target.value)} required disabled={!descricoes.length}>
                <option value="">{form.categoria_id ? 'Selecione...' : 'Selecione a categoria primeiro'}</option>
                {descricoes.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>
          </div>

          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Conta de Recebimento <span className={s.req}>*</span></label>
              <select className={s.select} value={form.conta_id} onChange={e => set('conta_id', e.target.value)} required>
                <option value="">Selecione...</option>
                {contas.map(c => <option key={c.id} value={c.id}>
                  {c.tipo === 'caixa' ? 'Caixa' : `${c.banco_nome || ''} — ${c.numero}`}
                </option>)}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>Projeto</label>
              <select className={s.select} value={form.projeto_id} onChange={e => set('projeto_id', e.target.value)}>
                <option value="">Nenhum</option>
                {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>

          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Valor <span className={s.req}>*</span></label>
              <div className={s.inputWrap}>
                <span className={s.inputPrefix}>R$</span>
                <input
                  type="number" step="0.01" min="0.01"
                  className={`${s.input} ${s.inputWithPrefix}`}
                  value={form.valor}
                  onChange={e => set('valor', e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
            <div className={s.field}>
              <label className={s.label}>Data <span className={s.req}>*</span></label>
              <input type="date" className={s.input} value={form.data} onChange={e => set('data', e.target.value)} required />
            </div>
          </div>

          <div className={s.field}>
            <label className={s.label}>Status</label>
            <div className={s.statusToggle}>
              {[
                { value: 'pendente',  label: 'Pendente',  cls: s.togglePendente  },
                { value: 'recebido',  label: 'Recebido',  cls: s.toggleRecebido  },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${s.toggleBtn} ${form.status === opt.value ? `${opt.cls} ${s.toggleActive}` : ''}`}
                  onClick={() => set('status', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={s.field}>
            <label className={s.label}>Observação</label>
            <textarea
              className={s.textarea}
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              rows={2}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className={s.formActions}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editing ? 'Salvar alterações' : 'Lançar receita'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir Receita"
        message={`Excluir receita de ${formatCurrency(deleteTarget?.valor)} em ${formatDate(deleteTarget?.data)}?`}
      />

      {/* ── Modal Processo Venda de Cacau ── */}
      <Modal
        isOpen={!!processo || loadingProcesso}
        onClose={() => { setProcesso(null); setLoadingProcesso(false); }}
        title="Processo de Venda de Cacau"
        width={560}
      >
        {loadingProcesso ? (
          <div className={s.processoLoading}>Carregando processo...</div>
        ) : processo ? (
          <div className={s.processoWrap}>
            {/* Dados da venda */}
            <div className={s.processoSection}>
              <div className={s.processoSectionTitle}>Venda — {processo.baixa?.numero_ordem || `#${processo.baixa?.id}`}</div>
              <div className={s.processoGrid}>
                <div className={s.processoField}>
                  <span className={s.processoFieldLabel}>Comprador</span>
                  <span className={s.processoFieldValue}>{processo.baixa?.credora_nome || '—'}</span>
                </div>
                <div className={s.processoField}>
                  <span className={s.processoFieldLabel}>Data</span>
                  <span className={s.processoFieldValue}>{formatDate(processo.baixa?.data)}</span>
                </div>
                <div className={s.processoField}>
                  <span className={s.processoFieldLabel}>Quantidade (kg)</span>
                  <span className={s.processoFieldValue}>{processo.baixa?.quantidade_kg ? `${Number(processo.baixa.quantidade_kg).toFixed(1)} kg` : '—'}</span>
                </div>
                <div className={s.processoField}>
                  <span className={s.processoFieldLabel}>Arrobas</span>
                  <span className={s.processoFieldValue}>{processo.baixa?.qtd_arrobas ? `${Number(processo.baixa.qtd_arrobas).toFixed(2)} @` : '—'}</span>
                </div>
                <div className={s.processoField}>
                  <span className={s.processoFieldLabel}>Preço / Arroba</span>
                  <span className={s.processoFieldValue}>{processo.baixa?.preco_arroba ? formatCurrency(processo.baixa.preco_arroba) : '—'}</span>
                </div>
                <div className={s.processoField}>
                  <span className={s.processoFieldLabel}>Total da Venda</span>
                  <span className={s.processoFieldMono}>{formatCurrency(processo.baixa?.valor_total)}</span>
                </div>
              </div>
            </div>

            {/* Parcelas de recebimento */}
            <div className={s.processoSection}>
              <div className={s.processoSectionTitle}>Recebimentos ({processo.parcelas?.length || 0})</div>
              <div className={s.parcelasList}>
                {(processo.parcelas || []).map((p, i) => (
                  <div key={p.id || i} className={s.parcelaCard}>
                    <div className={s.parcelaInfo}>
                      <span className={s.parcelaForma}>{p.forma_pagamento_nome || 'Sem forma definida'}</span>
                      <span className={s.parcelaConta}>
                        {p.banco_nome ? `${p.banco_nome} — ` : ''}{p.conta_numero || '—'}
                        {p.conta_tipo === 'caixa' ? ' (Caixa)' : ''}
                      </span>
                    </div>
                    <div className={s.parcelaRight}>
                      <span className={s.parcelaValor}>{formatCurrency(p.valor)}</span>
                      <span className={`${s.parcelaStatus} ${p.status}`}>{p.status === 'recebido' ? 'Recebido' : 'Pendente'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
