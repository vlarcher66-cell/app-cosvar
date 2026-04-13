import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import s from './Login.module.css';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.senha);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.cardTop}>
          <div className={s.brand}>
            <div className={s.logo}>C</div>
            <div>
              <h1 className={s.title}>Cosvar</h1>
              <p className={s.sub}>Sistema Financeiro</p>
            </div>
          </div>
        </div>

        <div className={s.cardBody}>
          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Email</label>
              <input
                className={s.input}
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>Senha</label>
              <input
                className={s.input}
                type="password"
                placeholder="••••••••"
                value={form.senha}
                onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
                required
              />
            </div>

            {error && <div className={s.error}>{error}</div>}

            <button className={s.submit} type="submit" disabled={loading}>
              {loading ? <span className={s.spinner} /> : 'Entrar no sistema'}
            </button>
          </form>

          <p className={s.hint}>
            Admin padrão: <code>admin@cosvar.com</code> / <code>Admin@123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
