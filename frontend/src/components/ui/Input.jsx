import s from './Input.module.css';

export default function Input({ label, error, ...props }) {
  return (
    <div className={s.field}>
      {label && <label className={s.label}>{label}</label>}
      <input className={`${s.input} ${error ? s.inputError : ''}`} {...props} />
      {error && <span className={s.error}>{error}</span>}
    </div>
  );
}
