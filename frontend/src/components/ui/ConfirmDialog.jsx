import Modal from './Modal';
import Button from './Button';
import s from './ConfirmDialog.module.css';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirmar', message, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width={420}>
      <p className={s.message}>{message}</p>
      <div className={s.actions}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Confirmar</Button>
      </div>
    </Modal>
  );
}
