import s from './DataTable.module.css';
import Spinner from '../ui/Spinner';

export default function DataTable({ columns, data, loading, emptyMessage = 'Nenhum registro encontrado' }) {
  if (loading) return <Spinner />;
  return (
    <div className={s.wrapper}>
      <table className={s.table}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={col.key + i}
                style={{ width: col.width, minWidth: col.minWidth, textAlign: col.align || 'center' }}
                className={s.th}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={s.empty}>{emptyMessage}</td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id || i} className={s.tr}>
                {columns.map((col, j) => (
                  <td key={col.key + j} className={s.td} style={{ textAlign: col.align || 'center' }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
