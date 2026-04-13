/**
 * Componente genérico para páginas de cadastro CRUD simples
 * Recebe: columns, service, title, FormComponent
 */
import { useState, useEffect, useCallback } from 'react';
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await service.getAll();
      setRows(data);
    } catch { toast?.error('Erro ao carregar dados'); }
    finally { setLoading(false); }
  }, [service]);

  useEffect(() => { load(); }, [load]);

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
    width: 100,
    render: (_, row) => (
      <div className={s.actions}>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(row); setModalOpen(true); }}>Editar</Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(row)}>
          <span style={{ color: 'var(--danger)' }}>Excluir</span>
        </Button>
      </div>
    ),
  };

  const statusCol = columns.find(c => c.key === 'status');
  const enhancedCols = columns.map(col =>
    col.key === 'status'
      ? { ...col, render: (v) => { const s2 = statusLabel[v]; return s2 ? <Badge color={s2.color}>{s2.label}</Badge> : v; } }
      : col
  );

  return (
    <div className={s.page}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={() => { setEditing(null); setModalOpen(true); }}
        actionLabel={`Novo ${title.split(' ').pop()}`}
      />

      <DataTable
        columns={[...enhancedCols, actionsCol]}
        data={rows}
        loading={loading}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? `Editar ${title.split(' ').pop()}` : `Novo ${title.split(' ').pop()}`}
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
