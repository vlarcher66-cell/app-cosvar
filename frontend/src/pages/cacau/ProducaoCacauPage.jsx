import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ActionButtons } from '../../components/ui/ActionButtons';
import producaoCacauService from '../../services/producaoCacauService';
import projetoService from '../../services/projetoService';
import produtorService from '../../services/produtorService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DataTable from '../../components/shared/DataTable';
import { useGlobalToast } from '../../components/layout/MainLayout';
import { formatCurrency, formatDate, formatDateInput, formatNumber } from '../../utils/formatters';
import s from './CacauPage.module.css';

// ── Conversões ──────────────────────────────────────
// 1 arroba (@) = 15 kg
// 1 saca (SC)  = 60 kg = 4 arrobas
// Produção dividida em KG: 50% meieiro | 50% fazenda

const calcular = (arrobas) => {
  const arr = parseFloat(arrobas) || 0;
  const kg            = arr * 15;
  const sacas         = arr / 4;
  const kg_meieiro    = kg * 0.5;
  const kg_fazenda    = kg * 0.5;
  return {
    kg:          kg.toFixed(3),
    sacas:       sacas.toFixed(3),
    kg_meieiro:  kg_meieiro.toFixed(3),
    kg_fazenda:  kg_fazenda.toFixed(3),
  };
};

const calcularPorKg = (kg) => {
  const k = parseFloat(kg) || 0;
  const arrobas    = k / 15;
  const sacas      = arrobas / 4;
  const kg_meieiro = k * 0.5;
  const kg_fazenda = k * 0.5;
  return {
    qtd_arrobas: arrobas.toFixed(3),
    sacas:       sacas.toFixed(3),
    kg_meieiro:  kg_meieiro.toFixed(3),
    kg_fazenda:  kg_fazenda.toFixed(3),
  };
};

const EMPTY = {
  data: '', projeto_id: '', produtor_id: '', producao: '',
  _kg_input: '',       // campo digitado pelo usuário (KG)
  qtd_arrobas: '', sacas: '', cmv_kg: '', lucro_kg: '', observacao: '',
  _kg_meieiro: '', _kg_fazenda: '',
};

export default function ProducaoCacauPage() {
  const toast = useGlobalToast();
  const [rows, setRows]           = useState([]);
  const [totais, setTotais]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [projetos, setProjetos]   = useState([]);
  const [produtores, setProdutores] = useState([]);
  const [filtros, setFiltros]     = useState({ data_inicio: '', data_fim: '', projeto_id: '', produtor_id: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([,v]) => v));
      const [data, tots] = await Promise.all([
        producaoCacauService.getAll(params),
        producaoCacauService.getTotais(params),
      ]);
      setRows(data);
      setTotais(tots);
    } catch { toast?.error('Erro ao carregar dados'); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([projetoService.getAll(), produtorService.getAll()])
      .then(([p, pd]) => { setProjetos(p); setProdutores(pd); });
  }, []);

  useEffect(() => {
    if (modalOpen && (projetos.length === 0 || produtores.length === 0)) {
      Promise.all([projetoService.getAll(), produtorService.getAll()])
        .then(([p, pd]) => { setProjetos(p); setProdutores(pd); });
    }
  }, [modalOpen]);

  // Atualiza campo e recalcula automaticamente ao digitar KG
  const set = (k, v) => {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      if (k === '_kg_input') {
        const calc = calcularPorKg(v);
        next.qtd_arrobas = calc.qtd_arrobas;
        next.sacas       = calc.sacas;
        next._kg_meieiro = calc.kg_meieiro;
        next._kg_fazenda = calc.kg_fazenda;
      }
      return next;
    });
  };

  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    const calc = calcular(row.qtd_arrobas);
    const kgTotal = (parseFloat(row.qtd_arrobas) || 0) * 15;
    setForm({
      data:        formatDateInput(row.data),
      projeto_id:  row.projeto_id,
      produtor_id: row.produtor_id,
      producao:    row.producao,
      _kg_input:   kgTotal.toFixed(3),
      qtd_arrobas: row.qtd_arrobas,
      sacas:       row.sacas || calc.sacas,
      cmv_kg:      row.cmv_kg  || '',
      lucro_kg:    row.lucro_kg || '',
      observacao:  row.observacao || '',
      _kg_meieiro: calc.kg_meieiro,
      _kg_fazenda: calc.kg_fazenda,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await producaoCacauService.update(editing.id, form); toast?.success('Produção atualizada'); }
      else         { await producaoCacauService.create(form); toast?.success('Produção registrada'); }
      setModalOpen(false); load();
    } catch (err) { toast?.error(err.response?.data?.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await producaoCacauService.remove(deleteTarget.id);
      toast?.success('Registro excluído'); setDeleteTarget(null); load();
    } catch { toast?.error('Erro ao excluir'); }
    finally { setDeleting(false); }
  };

  const setFiltro = (k, v) => setFiltros(p => ({ ...p, [k]: v }));
  const limparFiltros = () => setFiltros({ data_inicio: '', data_fim: '', projeto_id: '', produtor_id: '' });

  const kgTotal   = (arrobas) => `${formatNumber(Number(arrobas) * 15)} kg`;
  const kgFazenda = (arrobas) => `${formatNumber(Number(arrobas) * 15 * 0.5)} kg`;

  const columns = [
    { key: 'data',          label: 'Data',       width: 100, align: 'center', render: v => formatDate(v) },
    { key: 'projeto_nome',  label: 'Fazenda',    minWidth: 180, align: 'left' },
    { key: 'produtor_nome', label: 'Produtor',   align: 'left' },
    { key: 'producao',      label: 'Produção',   align: 'left' },
    { key: 'qtd_arrobas',   label: 'QTD @',      width: 90,  align: 'center', render: v => `${formatNumber(v)} @` },
    { key: 'sacas',         label: 'SC',         width: 110, align: 'center', render: v => v ? `${formatNumber(v)} sc` : '—' },
    { key: 'qtd_arrobas',   label: 'KG Total',   width: 100, align: 'center', render: v => kgTotal(v) },
    { key: 'qtd_arrobas',   label: 'KG Fazenda', width: 110, align: 'center', render: v => kgFazenda(v) },
    { key: '_actions',      label: 'Ações',      width: 90,  align: 'center', render: (_, row) => (
      <ActionButtons onEdit={() => openEdit(row)} onDelete={() => setDeleteTarget(row)} />
    )},
  ];

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Controle de Produção</h1>
          <p className={s.pageSub}>Registro de produção de cacau — 1@ = 15kg | 1 SC = 4@ = 60kg | 50% meieiro · 50% empresa</p>
        </div>
        <Button variant="primary" onClick={openNew}>+ Nova Produção</Button>
      </div>

      {/* KPI Cards */}
      {totais && (
        <motion.div
          className={s.kpis}
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <KpiCard label="Total Arrobas"   value={`${formatNumber(totais.total_arrobas)} @`}                                                                    color="accent"  icon={<IconArroba />} />
          <KpiCard label="Total KG"         value={`${formatNumber(totais.total_kg)} kg`}                                                                          color="info"    icon={<IconKg />} />
          <KpiCard label="Total Sacas"      value={`${formatNumber(totais.total_sacas)} sc`}                                                                       color="warning" icon={<IconSaca />} />
          <KpiCard label="KG Empresa (50%)" value={`${formatNumber(Number(totais.total_kg || 0) * 0.5)} kg`}                                                       color="success" icon={<IconEmpresa />} />
          <KpiCard label="Média KG Empresa" value={`${formatNumber((Number(totais.total_kg || 0) * 0.5) / Math.max(Number(totais.total_registros || 1), 1))} kg`} color="purple"  icon={<IconMedia />} />
        </motion.div>
      )}

      {/* Filtros */}
      <div className={s.filtersBar}>
        <div className={s.filtersLeft}>
          <input type="date" className={s.filterInput} value={filtros.data_inicio} onChange={e => setFiltro('data_inicio', e.target.value)} />
          <input type="date" className={s.filterInput} value={filtros.data_fim}    onChange={e => setFiltro('data_fim', e.target.value)} />
          <select className={s.filterSelect} value={filtros.projeto_id} onChange={e => setFiltro('projeto_id', e.target.value)}>
            <option value="">Todas as fazendas</option>
            {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <select className={s.filterSelect} value={filtros.produtor_id} onChange={e => setFiltro('produtor_id', e.target.value)}>
            <option value="">Todos os produtores</option>
            {produtores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <button className={s.clearBtn} onClick={limparFiltros}>✕ Limpar filtros</button>
      </div>

      <DataTable columns={columns} data={rows} loading={loading} emptyMessage="Nenhuma produção registrada" />

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Produção' : 'Nova Produção'} width={580}>
        <form onSubmit={handleSave} className={s.form}>
          <div className={s.grid2}>
            <Input label="Data *" type="date" value={form.data} onChange={e => set('data', e.target.value)} required />
            <Select label="Fazenda/Projeto *" value={form.projeto_id} onChange={e => set('projeto_id', e.target.value)} required>
              <option value="">Selecione...</option>
              {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </Select>
          </div>
          <div className={s.grid2}>
            <Select label="Produtor *" value={form.produtor_id} onChange={e => set('produtor_id', e.target.value)} required>
              <option value="">Selecione...</option>
              {produtores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </Select>
            <Input label="Descrição da Produção *" value={form.producao} onChange={e => set('producao', e.target.value)} placeholder="Ex: Safra 2025/1" required />
          </div>

          {/* Quantidade em KG — converte automaticamente */}
          <Input
            label="Quantidade KG *"
            type="number" step="0.001" min="0"
            value={form._kg_input}
            onChange={e => set('_kg_input', e.target.value)}
            placeholder="0.000"
            required
          />

          {/* Calculado automaticamente */}
          <div className={s.calcBox}>
            <span className={s.calcTitle}>Divisão da produção (calculado automaticamente)</span>
            <div className={s.calcRow}>
              <div className={s.calcItem}>
                <span className={s.calcLabel}>Arrobas (@)</span>
                <span className={s.calcValue}>
                  {form._kg_input ? `${formatNumber(form.qtd_arrobas)} @` : '—'}
                </span>
              </div>
              <div className={s.calcItem}>
                <span className={s.calcLabel}>Sacas (SC)</span>
                <span className={s.calcValue}>
                  {form._kg_input ? `${formatNumber(form.sacas)} sc` : '—'}
                </span>
              </div>
              <div className={s.calcItem}>
                <span className={s.calcLabel}>KG Meieiro (50%)</span>
                <span className={s.calcValue} style={{ color: 'var(--danger)' }}>
                  {form._kg_meieiro ? `${formatNumber(form._kg_meieiro)} kg` : '—'}
                </span>
              </div>
              <div className={s.calcItem}>
                <span className={s.calcLabel}>KG Fazenda (50%)</span>
                <span className={s.calcValue} style={{ color: 'var(--success)' }}>
                  {form._kg_fazenda ? `${formatNumber(form._kg_fazenda)} kg` : '—'}
                </span>
              </div>
            </div>
            {form._kg_input && (
              <div className={s.calcTotal}>
                Total: <strong>{formatNumber(form._kg_input)} kg</strong>
                &nbsp;= <strong>{formatNumber(form.qtd_arrobas)} @</strong>
                &nbsp;→ Meieiro: <strong style={{ color: 'var(--danger)' }}>{formatNumber(form._kg_meieiro)} kg</strong>
                &nbsp;| Fazenda: <strong style={{ color: 'var(--success)' }}>{formatNumber(form._kg_fazenda)} kg</strong>
              </div>
            )}
          </div>

          <div className={s.field}>
            <label className={s.label}>Observação</label>
            <textarea className={s.textarea} value={form.observacao} onChange={e => set('observacao', e.target.value)} rows={2} />
          </div>
          <div className={s.formActions}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={saving}>Salvar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleting} title="Excluir Produção"
        message={`Excluir o registro de "${deleteTarget?.producao}" (${formatDate(deleteTarget?.data)})?`}
      />
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.30, ease: [0.34, 1.06, 0.64, 1] } },
};

function KpiCard({ label, value, color, icon }) {
  return (
    <motion.div
      className={`${s.kpi} ${s[`kpi_${color}`]}`}
      variants={cardVariants}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(15,30,54,0.12)', transition: { duration: 0.18 } }}
    >
      <div className={s.kpiIcon}>{icon}</div>
      <div className={s.kpiText}>
        <div className={s.kpiValue}>{value}</div>
        <div className={s.kpiLabel}>{label}</div>
      </div>
    </motion.div>
  );
}

function KpiCardDuplo({ label, value1, value2, color, icon }) {
  return (
    <motion.div
      className={`${s.kpi} ${s[`kpi_${color}`]}`}
      variants={cardVariants}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(15,30,54,0.12)', transition: { duration: 0.18 } }}
    >
      <div className={s.kpiIcon}>{icon}</div>
      <div className={s.kpiText}>
        <div className={s.kpiDuploValues}>
          <span className={s.kpiValue}>{value1}</span>
          <span className={s.kpiDuploSep}>·</span>
          <span className={s.kpiValueSub}>{value2}</span>
        </div>
        <div className={s.kpiLabel}>{label}</div>
      </div>
    </motion.div>
  );
}

const IconArroba = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
  </svg>
);
const IconKg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IconSaca = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
const IconEmpresa = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconMedia = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="17" x2="22" y2="17" strokeDasharray="2 2"/>
  </svg>
);

