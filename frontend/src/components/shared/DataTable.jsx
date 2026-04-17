import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, SearchX } from 'lucide-react';
import s from './DataTable.module.css';
import Spinner from '../ui/Spinner';

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  }),
};

export default function DataTable({ columns, data, loading, emptyMessage = 'Nenhum registro encontrado' }) {
  if (loading) return (
    <div className={s.spinnerWrap}>
      <Spinner />
    </div>
  );

  return (
    <div className={s.wrapper}>
      <table className={s.table}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={col.key + i}
                style={{ width: col.width, minWidth: col.minWidth }}
                className={`${s.th} ${col.align === 'left' || col.key === 'nome' || col.key === 'name' ? s.thLeft : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={s.empty}>
                <div className={s.emptyInner}>
                  <SearchX size={36} strokeWidth={1.2} />
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            <AnimatePresence initial={false}>
              {data.map((row, i) => (
                <motion.tr
                  key={row.id || i}
                  className={s.tr}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  layout
                >
                  {columns.map((col, j) => {
                    const isName = col.key === 'nome' || col.key === 'name';
                    const val = col.render ? col.render(row[col.key], row) : row[col.key];
                    return (
                      <td
                        key={col.key + j}
                        className={`${s.td} ${col.align === 'left' || isName ? s.tdLeft : ''}`}
                      >
                        {isName && !col.render ? (
                          <div className={s.nameCell}>
                            <span className={s.avatar}>{String(row[col.key] || '?')[0].toUpperCase()}</span>
                            <span className={s.nameText}>{val}</span>
                          </div>
                        ) : val}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  );
}
