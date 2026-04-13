import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import s from './Sidebar.module.css';

const W_OPEN   = 248;
const W_CLOSED = 64;

/* ── Ícones ── */
const Icon = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  finance:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  expense:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  income:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  register:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  reports:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  cacau:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="4" ry="6"/><path d="M12 6C9 4 5 5 4 9s1 8 5 9"/><path d="M12 6c3-2 7-1 8 3s-1 8-5 9"/><line x1="12" y1="2" x2="12" y2="6"/></svg>,
  chevron:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  left:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  right:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

/* ── Bottom Nav Mobile ── */
function BottomNav() {
  const location = useLocation();
  return (
    <nav className={s.bottomNav}>
      <NavLink to="/dashboard"       className={({ isActive }) => `${s.bnItem} ${isActive ? s.bnActive : ''}`}>
        <span className={s.bnIcon}>{Icon.dashboard}</span>
        <span className={s.bnLabel}>Início</span>
      </NavLink>
      <NavLink to="/despesas"        className={({ isActive }) => `${s.bnItem} ${isActive ? s.bnActive : ''}`}>
        <span className={s.bnIcon}>{Icon.expense}</span>
        <span className={s.bnLabel}>Despesa</span>
      </NavLink>
      <NavLink to="/receitas"        className={({ isActive }) => `${s.bnItem} ${isActive ? s.bnActive : ''}`}>
        <span className={s.bnIcon}>{Icon.income}</span>
        <span className={s.bnLabel}>Receita</span>
      </NavLink>
      <NavLink to="/cacau/producao"  className={({ isActive }) => `${s.bnItem} ${(isActive || location.pathname.startsWith('/cacau')) ? s.bnActive : ''}`}>
        <span className={s.bnIcon}>{Icon.cacau}</span>
        <span className={s.bnLabel}>Cacau</span>
      </NavLink>
      <NavLink to="/relatorios"      className={({ isActive }) => `${s.bnItem} ${isActive ? s.bnActive : ''}`}>
        <span className={s.bnIcon}>{Icon.reports}</span>
        <span className={s.bnLabel}>Relatórios</span>
      </NavLink>
    </nav>
  );
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: Icon.dashboard, path: '/dashboard' },
  {
    id: 'financeiro', label: 'Financeiro', icon: Icon.finance,
    children: [
      { label: 'Lançar Despesa', path: '/despesas', icon: Icon.expense, color: '#ef4444' },
      { label: 'Lançar Receita', path: '/receitas', icon: Icon.income,  color: '#10b981' },
    ],
  },
  {
    id: 'cadastros', label: 'Cadastros', icon: Icon.register,
    children: [
      { label: 'Grupo',           path: '/cadastros/grupos' },
      { label: 'Subgrupo',        path: '/cadastros/subgrupos' },
      { label: 'Item',            path: '/cadastros/itens' },
      { label: 'Categoria',       path: '/cadastros/categorias' },
      { label: 'Descrição',       path: '/cadastros/descricoes' },
      { label: 'Produtor',        path: '/cadastros/produtores' },
      { label: 'Fornecedor',      path: '/cadastros/fornecedores' },
      { label: 'Comprador',       path: '/cadastros/compradores' },
      { label: 'Projetos',        path: '/cadastros/projetos' },
      { label: 'Centro de Custo', path: '/cadastros/centros-custo' },
      { label: 'Banco',           path: '/cadastros/bancos' },
      { label: 'Conta',           path: '/cadastros/contas' },
    ],
  },
  {
    id: 'cacau', label: 'Cacau', icon: Icon.cacau,
    children: [
      { label: 'Controle de Produção', path: '/cacau/producao' },
      { label: 'Cacau a Ordem',        path: '/cacau/ordens' },
    ],
  },
  { id: 'relatorios', label: 'Relatórios', icon: Icon.reports, path: '/relatorios' },
];

const spring = { type: 'spring', stiffness: 320, damping: 30 };
const fade   = { duration: 0.15, ease: [0.4, 0, 0.2, 1] };

/* ── Label animado ── */
function NavLabel({ children }) {
  return (
    <motion.span
      className={s.navLabel}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -4 }}
      transition={fade}
    >
      {children}
    </motion.span>
  );
}

/* ── Tooltip wrapper — usa title nativo para evitar clipping do overflow ── */
function Tooltip({ label, children }) {
  return (
    <span title={label} style={{ display: 'flex', width: '100%' }}>
      {children}
    </span>
  );
}

/* ── Grupo colapsável ── */
function NavGroup({ item, collapsed, onClose }) {
  const location  = useLocation();
  const isActive  = item.children?.some(c => location.pathname.startsWith(c.path));
  const [open, setOpen] = useState(isActive);

  useEffect(() => { if (isActive) setOpen(true); }, [location.pathname]);

  if (collapsed) {
    return (
      <Tooltip label={item.label}>
        <button className={`${s.iconBtn} ${isActive ? s.iconBtnActive : ''}`}>
          <span className={s.navIcon}>{item.icon}</span>
          {isActive && <span className={s.iconDot} />}
        </button>
      </Tooltip>
    );
  }

  return (
    <div className={s.group}>
      <button
        className={`${s.groupBtn} ${isActive ? s.groupBtnActive : ''}`}
        onClick={() => setOpen(p => !p)}
      >
        <span className={s.groupBtnLeft}>
          <span className={s.navIcon}>{item.icon}</span>
          <span className={s.navLabel}>{item.label}</span>
        </span>
        <motion.span
          className={s.chevron}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ display: 'flex', alignItems: 'center', minWidth: 14, flexShrink: 0 }}
        >
          {Icon.chevron}
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={s.groupChildren}>
              {item.children.map((child, i) => (
                <motion.div
                  key={child.path}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.15 }}
                >
                  <NavLink
                    to={child.path}
                    className={({ isActive }) => `${s.child} ${isActive ? s.childActive : ''}`}
                    onClick={onClose}
                  >
                    {child.icon
                      ? <span className={s.childIcon} style={{ color: child.color }}>{child.icon}</span>
                      : <span className={s.childDot} />
                    }
                    <span>{child.label}</span>
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sidebar principal ── */
export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Overlay mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={s.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`${s.sidebar} ${mobileOpen ? s.sidebarMobileOpen : ''}`}
        initial={{ width: W_OPEN }}
        animate={{ width: collapsed ? W_CLOSED : W_OPEN }}
        transition={spring}
      >
        {/* ── Brand ── */}
        <div className={`${s.brand} ${collapsed ? s.brandCollapsed : ''}`}>
          <motion.div
            className={s.brandMark}
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          >
            <img src="/logo.png" alt="Cosvar" className={s.brandLogoIcon} />
          </motion.div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                style={{ display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden', minWidth: 0, flex: 1 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={fade}
              >
                <span className={s.brandName}>Cosvar</span>
                <span className={s.brandVersion}>Sistema Financeiro</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.button
                className={s.collapseIconBtn}
                onClick={onToggleCollapse}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                aria-label="Recolher menu"
                title="Recolher"
              >
                {Icon.left}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Botão expandir — só aparece quando colapsado, centralizado */}
        <AnimatePresence initial={false}>
          {collapsed && (
            <motion.button
              className={s.expandBtn}
              onClick={onToggleCollapse}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.88 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              aria-label="Expandir menu"
              title="Expandir"
            >
              {Icon.right}
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Nav ── */}
        <nav className={s.nav}>
          {NAV.map((item) => {
            if (item.path) {
              if (collapsed) {
                return (
                  <Tooltip key={item.id} label={item.label}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => `${s.iconBtn} ${isActive ? s.iconBtnActive : ''}`}
                      onClick={onMobileClose}
                    >
                      <span className={s.navIcon}>{item.icon}</span>
                    </NavLink>
                  </Tooltip>
                );
              }
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => `${s.navItem} ${isActive ? s.navItemActive : ''}`}
                  onClick={onMobileClose}
                >
                  <span className={s.navIcon}>{item.icon}</span>
                  <AnimatePresence initial={false}>
                    {!collapsed && <NavLabel>{item.label}</NavLabel>}
                  </AnimatePresence>
                </NavLink>
              );
            }
            return (
              <NavGroup
                key={item.id}
                item={item}
                collapsed={collapsed}
                onClose={onMobileClose}
              />
            );
          })}
        </nav>

      </motion.aside>

      {/* ── Bottom navigation bar — mobile only ── */}
      <BottomNav />
    </>
  );
}
