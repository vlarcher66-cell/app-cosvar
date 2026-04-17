import s from './DataTable.module.css';
import Spinner from '../ui/Spinner';

export default function DataTable({ columns, data, loading, emptyMessage = 'Nenhum registro encontrado' }) {
  if (loading) return <div className={s.spinnerWrap}><Spinner /></div>;
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
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-faint)',marginBottom:8}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id || i} className={s.tr}>
                {columns.map((col, j) => {
                  const isName = col.key === 'nome' || col.key === 'name';
                  const isFirst = j === 0;
                  const val = col.render ? col.render(row[col.key], row) : row[col.key];
                  return (
                    <td
                      key={col.key + j}
                      className={`${s.td} ${isName ? s.tdName : ''} ${col.align === 'left' || isName ? s.tdLeft : ''}`}
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
