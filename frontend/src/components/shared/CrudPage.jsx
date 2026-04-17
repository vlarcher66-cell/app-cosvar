import { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import Button from '../ui/Button';
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
    } finally {
      setSaving(false);
    }
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
    } finally {
      setDeleting(false);
    }
  };

  const actionsCol = {
    key: '_actions',
    label: 'Ações',
    width: 110,
    render: (_, row) => (
      <div className={s.actions}>
        <button className={s.btnEdit} onClick={() => { setEditing(row); setModalOpen(true); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        <button className={s.btnDelete} onClick={() => setDeleteTarget(row)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
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
    <div className={s.page}>
      <div className={s.topRow}>
        <div className={s.titleBlock}>
          <h1 className={s.title}>{title}</h1>
          {subtitle && <p className={s.subtitle}>{subtitle}</p>}
        </div>
        <button className={s.btnNew} onClick={() => { setEditing(null); setModalOpen(true); }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo {entityName}
        </button>
      </div>

      <div className={s.toolbar}>
        <div className={s.searchWrap}>
          <svg className={s.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className={s.searchInput}
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={s.searchClear} onClick={() => setSearch('')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        <div className={s.counter}>
          {loading ? '…' : (
            search
              ? <><strong>{filtered.length}</strong> de {rows.length} registro{rows.length !== 1 ? 's' : ''}</>
              : <><strong>{rows.length}</strong> registro{rows.length !== 1 ? 's' : ''}</>
          )}
        </div>
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
    </div>
  );
}
