import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import transferenciaService from '../../services/transferenciaService';
import contaService from '../../services/contaService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DataTable from '../../components/shared/DataTable';
import DateInput from '../../components/ui/DateInput';
import CurrencyInput from '../../components/ui/CurrencyInput';
import { useGlobalToast } from '../../components/layout/MainLayout';
import { formatCurrency, formatDate, formatDateInput } from '../../utils/formatters';
import s from './TransferenciaPage.module.css';

const IcoTransfer = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const IcoPlus    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoEdit    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoDelete  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoFilter  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;

const EMPTY = { conta_origem_id: '', conta_destino_id: '', valor: '', data: '', observacao: '' };

const labelConta = (c) => c.tipo === 'caixa' ? 'Caixa' : `${c.origem_banco || c.banco_nome || ''} — ${c.origem_numero || c.numero}`;

export default function TransferenciaPage() {
  const toast = useGlobalToast();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [contas,  setContas]  = useState([]);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing,   setEditing]       = useState(null);
  const [saving,    setSaving]        = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,  setDeleting]      = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      setRows(await transferenciaService.getAll(params));
    } catch { toast?.error('Erro ao carregar transferências'); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { contaService.getAll().then(setContas); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      conta_origem_id:  String(row.conta_origem_id),
      conta_destino_id: String(row.conta_destino_id),
      valor: row.valor,
      data:  formatDateInput(row.data),
      observacao: row.observacao || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await transferenciaService.update(editing.id, form); toast?.success('Transferência atualizada'); }
      else         { await transferenciaService.create(form); toast?.success('Transferência registrada'); }
      setModalOpen(false); load();
    } catch (err) { toast?.error(err.response?.data?.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await transferenciaService.remove(deleteTarget.id); toast?.success('Transferência excluída'); setDeleteTarget(null); load(); }
    catch { toast?.error('Erro ao excluir'); }
    finally { setDeleting(false); }
  };

  const nomeConta = (row, lado) => {
    if (lado === 'origem') {
      return row.origem_tipo === 'caixa' ? 'Caixa' : `${row.origem_banco || ''} — ${row.origem_numero || ''}`;
    }
    return row.destino_tipo === 'caixa' ? 'Caixa' : `${row.destino_banco || ''} — ${row.destino_numero || ''}`;
  };

  const totalTransferido = rows.reduce((a, r) => a + Number(r.valor || 0), 0);
  const temFiltro = Object.values(filtros).some(v => v);

  const columns = [
    { key: 'data',  label: 'Data',    width: 110, render: v => <span className={s.cellDate}>{formatDate(v)}</span> },
    { key: '_origem',  label: 'Origem',  render: (_, row) => <span className={s.cellConta}>{nomeConta(row, 'origem')}</span> },
    { key: '_arrow',   label: '',        width: 40,  render: () => <span className={s.arrow}>→</span> },
    { key: '_destino', label: 'Destino', render: (_, row) => <span className={s.cellConta}>{nomeConta(row, 'destino')}</span> },
    { key: 'valor',    label: 'Valor',   width: 130, align: 'right', render: v => <span className={s.cellValor}>{formatCurrency(v)}</span> },
    { key: 'observacao', label: 'Obs.', render: v => v || '—' },
    { key: '_actions', label: 'Ações', width: 90, align: 'center', render: (_, row) => (
      <div className={s.actions}>
        <button className={s.btnEdit}   onClick={() => openEdit(row)}        title="Editar"><IcoEdit /></button>
        <button className={s.btnDelete} onClick={() => setDeleteTarget(row)} title="Excluir"><IcoDelete /></button>
      </div>
    )},
  ];

  return (
    <div className={s.page}>

      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}><IcoTransfer /></div>
          <div>
            <h1 className={s.pageTitle}>Transferências</h1>
            <p className={s.pageSub}>Movimentos internos entre contas e caixas</p>
          </div>
        </div>
        <motion.button className={s.newBtn} onClick={openNew} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <IcoPlus /> Nova Transferência
        </motion.button>
      </div>

      {/* KPI */}
      <motion.div className={s.kpiWrap} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className={s.kpi}>
          <div className={s.kpiBar} />
          <div className={s.kpiIcon}><IcoTransfer /></div>
          <div className={s.kpiBody}>
            <div className={s.kpiValue}>{formatCurrency(totalTransferido)}</div>
            <div className={s.kpiLabel}>Total Transferido</div>
          </div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiBar} />
          <div className={s.kpiIcon}><IcoTransfer /></div>
          <div className={s.kpiBody}>
            <div className={s.kpiValue}>{rows.length}</div>
            <div className={s.kpiLabel}>Transferências</div>
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div className={s.filterBar} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className={s.filterIcon}><IcoFilter /></div>
        <DateInput className={s.filterInput} value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
        <span className={s.filterSep}>—</span>
        <DateInput className={s.filterInput} value={filtros.data_fim} onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
        <AnimatePresence>
          {temFiltro && (
            <motion.button className={s.clearBtn} onClick={() => setFiltros({ data_inicio: '', data_fim: '' })}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}>
              ✕ Limpar
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DataTable columns={columns} data={rows} loading={loading} emptyMessage="Nenhuma transferência registrada" />
      </motion.div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Transferência' : 'Nova Transferência'} width={480}>
        <form onSubmit={handleSave} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Conta de Origem <span className={s.req}>*</span></label>
            <select className={s.select} value={form.conta_origem_id} onChange={e => set('conta_origem_id', e.target.value)} required>
              <option value="">Selecione...</option>
              {contas.filter(c => String(c.id) !== String(form.conta_destino_id)).map(c => (
                <option key={c.id} value={c.id}>{c.tipo === 'caixa' ? 'Caixa' : `${c.banco_nome || ''} — ${c.numero}`}</option>
              ))}
            </select>
          </div>

          <div className={s.field}>
            <label className={s.label}>Conta de Destino <span className={s.req}>*</span></label>
            <select className={s.select} value={form.conta_destino_id} onChange={e => set('conta_destino_id', e.target.value)} required>
              <option value="">Selecione...</option>
              {contas.filter(c => String(c.id) !== String(form.conta_origem_id)).map(c => (
                <option key={c.id} value={c.id}>{c.tipo === 'caixa' ? 'Caixa' : `${c.banco_nome || ''} — ${c.numero}`}</option>
              ))}
            </select>
          </div>

          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Valor <span className={s.req}>*</span></label>
              <div className={s.inputWrap}>
                <span className={s.inputPrefix}>R$</span>
                <CurrencyInput className={`${s.input} ${s.inputWithPrefix}`} value={form.valor} onChange={e => set('valor', e.target.value)} required />
              </div>
            </div>
            <div className={s.field}>
              <label className={s.label}>Data <span className={s.req}>*</span></label>
              <DateInput className={s.input} value={form.data} onChange={e => set('data', e.target.value)} required />
            </div>
          </div>

          <div className={s.field}>
            <label className={s.label}>Observação</label>
            <textarea className={s.textarea} value={form.observacao} onChange={e => set('observacao', e.target.value)} rows={2} placeholder="Observações..." />
          </div>

          <div className={s.formActions}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={saving}>{editing ? 'Salvar alterações' : 'Registrar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir Transferência"
        message={`Excluir transferência de ${formatCurrency(deleteTarget?.valor)}?`}
      />
    </div>
  );
}
