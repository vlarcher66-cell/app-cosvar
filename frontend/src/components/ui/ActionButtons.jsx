import { motion } from 'framer-motion';
import s from './ActionButtons.module.css';

export function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className={s.wrap}>
      <Tip label="Editar">
        <motion.button
          className={`${s.btn} ${s.edit}`}
          onClick={onEdit}
          whileHover={{ scale: 1.10 }}
          whileTap={{ scale: 0.90 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        >
          <IconEdit />
        </motion.button>
      </Tip>

      <Tip label="Excluir">
        <motion.button
          className={`${s.btn} ${s.del}`}
          onClick={onDelete}
          whileHover={{ scale: 1.10 }}
          whileTap={{ scale: 0.90 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        >
          <IconTrash />
        </motion.button>
      </Tip>
    </div>
  );
}

function Tip({ label, children }) {
  return (
    <div className={s.tip}>
      {children}
      <span className={s.tipLabel}>{label}</span>
    </div>
  );
}

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
