import { useRef } from 'react';
import s from './Input.module.css';

export default function Input({ label, error, onClick, ...props }) {
  const ref = useRef(null);

  const handleClick = (e) => {
    if (props.type === 'date') { try { ref.current?.showPicker(); } catch (_) {} }
    onClick?.(e);
  };

  return (
    <div className={s.field}>
      {label && <label className={s.label}>{label}</label>}
      <input ref={ref} className={`${s.input} ${error ? s.inputError : ''}`} onClick={handleClick} {...props} />
      {error && <span className={s.error}>{error}</span>}
    </div>
  );
}
