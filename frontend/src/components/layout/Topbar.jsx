import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import s from './Topbar.module.css';

const BREADCRUMBS = {
  '/dashboard':              ['Dashboard'],
  '/despesas':               ['Financeiro', 'Lançar Despesa'],
  '/receitas':               ['Financeiro', 'Lançar Receita'],
  '/relatorios':             ['Relatórios'],
  '/cacau/producao':         ['Cacau', 'Controle de Produção'],
  '/cacau/ordens':           ['Cacau', 'Cacau a Ordem'],
  '/cadastros/grupos':       ['Cadastros', 'Grupos'],
  '/cadastros/subgrupos':    ['Cadastros', 'Subgrupos'],
  '/cadastros/itens':        ['Cadastros', 'Itens'],
  '/cadastros/categorias':   ['Cadastros', 'Categorias'],
  '/cadastros/descricoes':   ['Cadastros', 'Descrições'],
  '/cadastros/produtores':   ['Cadastros', 'Produtores'],
  '/cadastros/fornecedores': ['Cadastros', 'Fornecedores'],
  '/cadastros/compradores':  ['Cadastros', 'Compradores'],
  '/cadastros/projetos':     ['Cadastros', 'Projetos'],
  '/cadastros/centros-custo':['Cadastros', 'Centro de Custo'],
  '/cadastros/bancos':       ['Cadastros', 'Bancos'],
  '/cadastros/contas':       ['Cadastros', 'Contas'],
};

const spring = { type: 'spring', stiffness: 320, damping: 30 };

export default function Topbar({ onMobileMenu, sidebarWidth = 248 }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const crumbs = BREADCRUMBS[location.pathname] || ['Cosvar'];

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.header
      className={s.topbar}
      initial={{ left: 248 }}
      animate={{ left: sidebarWidth }}
      transition={spring}
    >
      <button className={s.menuBtn} onClick={onMobileMenu} aria-label="Menu">
        <span /><span /><span />
      </button>

      <nav className={s.breadcrumb}>
        {crumbs.map((c, i) => (
          <span key={i} className={s.crumbItem}>
            {i > 0 && <span className={s.crumbSep}>›</span>}
            <span className={i === crumbs.length - 1 ? s.crumbActive : s.crumbParent}>{c}</span>
          </span>
        ))}
      </nav>

      <div className={s.right}>
        <span className={s.roleBadge}>{user?.perfil}</span>
        <div className={s.avatarWrap} ref={dropRef}>
          <button className={`${s.avatar} ${dropOpen ? s.avatarOpen : ''}`} onClick={() => setDropOpen(p => !p)}>
            {user?.nome?.[0]?.toUpperCase()}
          </button>
          {dropOpen && (
            <div className={s.dropdown}>
              <div className={s.dropHead}>
                <div className={s.dropAv}>{user?.nome?.[0]?.toUpperCase()}</div>
                <div>
                  <div className={s.dropName}>{user?.nome}</div>
                  <div className={s.dropEmail}>{user?.email}</div>
                </div>
              </div>
              <div className={s.dropDivider} />
              <button className={s.dropItem} onClick={() => { setDropOpen(false); logout(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sair do sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
