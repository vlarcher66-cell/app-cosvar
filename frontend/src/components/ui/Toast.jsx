import s from './Toast.module.css';

export default function ToastContainer({ toasts }) {
  return (
    <div className={s.container}>
      {toasts.map(t => (
        <div key={t.id} className={`${s.toast} ${s[t.type]}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
