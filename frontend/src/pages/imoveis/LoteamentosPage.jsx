import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import empreendimentoService from '../../services/empreendimentoService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useGlobalToast } from '../../components/layout/MainLayout';
import s from './LoteamentosPage.module.css';

const IcoBuilding = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>;
const IcoPlus    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoEdit    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoDelete  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoMap     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;

const EMPTY = { nome: '', cidade: '', bairro: '', descricao: '' };

export default function LoteamentosPage() {
  const toast    = useGlobalToast();
  const navigate = useNavigate();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    try { setRows(await empreendimentoService.getAll()); }
    catch { toast?.error('Erro ao carregar empreendimentos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openNew  = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ nome: row.nome, cidade: row.cidade || '', bairro: row.bairro || '', descricao: row.descricao || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await empreendimentoService.update(editing.id, form); toast?.success('Empreendimento atualizado'); }
      else         { await empreendimentoService.create(form); toast?.success('Empreendimento criado'); }
      setModalOpen(false); load();
    } catch { toast?.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await empreendimentoService.remove(deleteTarget.id); toast?.success('Excluído'); setDeleteTarget(null); load(); }
    catch { toast?.error('Erro ao excluir'); }
    finally { setDeleting(false); }
  };

  const pct = (row) => row.total_lotes > 0 ? Math.round((row.lotes_vendidos / row.total_lotes) * 100) : 0;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}><IcoMap /></div>
          <div>
            <h1 className={s.pageTitle}>Loteamentos</h1>
            <p className={s.pageSub}>Empreendimentos imobiliários</p>
          </div>
        </div>
        <motion.button className={s.newBtn} onClick={openNew} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <IcoPlus /> Novo Empreendimento
        </motion.button>
      </div>

      {loading ? (
        <div className={s.loading}>Carregando...</div>
      ) : rows.length === 0 ? (
        <div className={s.empty}>Nenhum empreendimento cadastrado</div>
      ) : (
        <div className={s.grid}>
          {rows.map((row, i) => (
            <motion.div key={row.id} className={s.card}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}>
              <div className={s.cardBar} />
              <div className={s.cardHeader}>
                <div className={s.cardIcon}><IcoBuilding /></div>
                <div className={s.cardActions}>
                  <button className={s.btnEdit}   onClick={() => openEdit(row)} title="Editar"><IcoEdit /></button>
                  <button className={s.btnDelete} onClick={() => setDeleteTarget(row)} title="Excluir"><IcoDelete /></button>
                </div>
              </div>
              <h2 className={s.cardTitle}>{row.nome}</h2>
              {row.cidade && <p className={s.cardSub}>{row.cidade}{row.bairro ? ` — ${row.bairro}` : ''}</p>}

              <div className={s.statsRow}>
                <div className={s.stat}>
                  <span className={s.statVal}>{row.total_lotes}</span>
                  <span className={s.statLabel}>Total</span>
                </div>
                <div className={s.stat}>
                  <span className={s.statVal} style={{ color: '#10b981' }}>{row.lotes_disponiveis}</span>
                  <span className={s.statLabel}>Disponíveis</span>
                </div>
                <div className={s.stat}>
                  <span className={s.statVal} style={{ color: '#f59e0b' }}>{row.lotes_reservados}</span>
                  <span className={s.statLabel}>Reservados</span>
                </div>
                <div className={s.stat}>
                  <span className={s.statVal} style={{ color: '#ef4444' }}>{row.lotes_vendidos}</span>
                  <span className={s.statLabel}>Vendidos</span>
                </div>
              </div>

              <div className={s.progressWrap}>
                <div className={s.progressBar}>
                  <motion.div className={s.progressFill}
                    initial={{ width: 0 }} animate={{ width: `${pct(row)}%` }}
                    transition={{ delay: i * 0.07 + 0.3, duration: 0.6 }} />
                </div>
                <span className={s.progressLabel}>{pct(row)}% vendido</span>
              </div>

              <motion.button className={s.mapBtn} onClick={() => navigate(`/imoveis/mapa/${row.id}`)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <IcoMap /> Ver Mapa
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Empreendimento' : 'Novo Empreendimento'} width={480}>
        <form onSubmit={handleSave} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Nome <span className={s.req}>*</span></label>
            <input className={s.input} value={form.nome} onChange={e => set('nome', e.target.value)} required placeholder="Ex: Loteamento São José" />
          </div>
          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Cidade</label>
              <input className={s.input} value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Cidade" />
            </div>
            <div className={s.field}>
              <label className={s.label}>Bairro</label>
              <input className={s.input} value={form.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Bairro" />
            </div>
          </div>
          <div className={s.field}>
            <label className={s.label}>Descrição</label>
            <textarea className={s.textarea} value={form.descricao} onChange={e => set('descricao', e.target.value)} rows={2} placeholder="Observações..." />
          </div>
          <div className={s.formActions}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={saving}>{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Excluir Empreendimento"
        message={`Excluir "${deleteTarget?.nome}"? Todos os lotes serão removidos.`} />
    </div>
  );
}
