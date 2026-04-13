import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import s from './Modal.module.css';

export default function Modal({ isOpen, onClose, title, children, width = 540 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={s.overlay} onClick={onClose}>
      <div
        className={s.modal}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.header}>
          <h3 className={s.title}>{title}</h3>
          <button className={s.close} onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className={s.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
