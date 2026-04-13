import styles from './Badge.module.css';

export default function Badge({ color = 'info', children }) {
  return <span className={`${styles.badge} ${styles[color]}`}>{children}</span>;
}
