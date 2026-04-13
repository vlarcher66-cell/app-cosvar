import s from './Spinner.module.css';

export default function Spinner({ size = 32 }) {
  return (
    <div className={s.wrap}>
      <div className={s.spinner} style={{ width: size, height: size }} />
    </div>
  );
}
