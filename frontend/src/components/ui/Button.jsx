import s from './Button.module.css';

export default function Button({
  children, onClick, type = 'button',
  variant = 'primary', size = 'md',
  disabled = false, loading = false,
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${s.btn} ${s[variant]} ${s[size]} ${className}`}
    >
      {loading && <span className={s.spinner} />}
      {children}
    </button>
  );
}
