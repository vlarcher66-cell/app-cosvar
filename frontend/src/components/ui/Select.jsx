import s from './Input.module.css';

export default function Select({ label, error, children, ...props }) {
  return (
    <div className={s.field}>
      {label && <label className={s.label}>{label}</label>}
      <select className={`${s.input} ${error ? s.inputError : ''}`} {...props}>
        {children}
      </select>
      {error && <span className={s.error}>{error}</span>}
    </div>
  );
}
