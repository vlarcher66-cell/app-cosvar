import s from './PageHeader.module.css';
import Button from '../ui/Button';

export default function PageHeader({ title, subtitle, action, actionLabel, actionIcon = '+' }) {
  return (
    <div className={s.header}>
      <div>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {action && (
        <Button onClick={action} variant="primary">
          <span>{actionIcon}</span> {actionLabel}
        </Button>
      )}
    </div>
  );
}
