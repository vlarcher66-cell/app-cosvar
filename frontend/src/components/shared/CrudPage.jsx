import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import DataTable from './DataTable';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import Badge from '../ui/Badge';
import { useGlobalToast } from '../layout/MainLayout';
import { statusLabel } from '../../utils/formatters';
import s from './CrudPage.module.css';

export default function CrudPage({ title, subtitle, service, columns, FormComponent, modalWidth = 480 }) {
  const toast = useGlobalToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await service.getAll();
      setRows(data);
    } catch { toast?.error('Erro ao carregar dados'); }
    finally { setLoading(false); }
  }, [service]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(row =>
      Object.values(row).some(v => v != null && String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editing) {
        await service.update(editing.id, formData);
        toast?.success('Atualizado com sucesso');
      } else {
        await service.create(formData);
        toast?.success('Criado com sucesso');
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await service.remove(deleteTarget.id);
      toast?.success('Excluído com sucesso');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Erro ao excluir');
    } finally { setDeleting(false); }
  };

  const actionsCol = {
    key: '_actions',
    label: 'Ações',
    width: 120,
    render: (_, row) => (
      <div className={s.actions}>
        <button className={s.btnEdit} onClick={() => { setEditing(row); setModalOpen(true); }}>
          Editar
        </button>
        <button className={s.btnDelete} onClick={() => setDeleteTarget(row)}>
          Excluir
        </button>
      </div>
    ),
  };

  const enhancedCols = columns.map(col =>
    col.key === 'status'
      ? { ...col, render: (v) => { const s2 = statusLabel[v]; return s2 ? <Badge color={s2.color}>{s2.label}</Badge> : v; } }
      : col
  );

  const entityName = title.split(/[\s—–-]/).filter(Boolean).pop();

  return (
    <motion.div
      className={s.page}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className={s.topRow}>
        <div>
          <h1 className={s.title}>{title}</h1>
          {subtitle && <p className={s.subtitle}>{subtitle}</p>}
        </div>
        <motion.button
          className={s.btnNew}
          onClick={() => { setEditing(null); setModalOpen(true); }}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Novo {entityName}
        </motion.button>
      </div>

      {/* Toolbar */}
      <div className={s.toolbar}>
        <div className={s.searchWrap}>
          <Search size={14} className={s.searchIcon} />
          <input
            className={s.searchInput}
            type="text"
            placeholder={`Buscar em ${title.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <AnimatePresence>
            {search && (
              <motion.button
                className={s.searchClear}
                onClick={() => setSearch('')}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.12 }}
              >
                <X size={12} strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {!loading && (
            <motion.div
              className={s.counter}
              key={`${filtered.length}-${rows.length}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {search
                ? <><strong>{filtered.length}</strong> de {rows.length} registro{rows.length !== 1 ? 's' : ''}</>
                : <><strong>{rows.length}</strong> registro{rows.length !== 1 ? 's' : ''}</>
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DataTable
        columns={[...enhancedCols, actionsCol]}
        data={filtered}
        loading={loading}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? `Editar ${entityName}` : `Novo ${entityName}`}
        width={modalWidth}
      >
        <FormComponent
          initial={editing}
          onSave={handleSave}
          saving={saving}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Confirmar exclusão"
        message={`Deseja realmente excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </motion.div>
  );
}
