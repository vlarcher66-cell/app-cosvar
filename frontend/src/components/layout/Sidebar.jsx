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
  bank:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>,
  transfer:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  register:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  reports:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  cacau:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="4" ry="6"/><path d="M12 6C9 4 5 5 4 9s1 8 5 9"/><path d="M12 6c3-2 7-1 8 3s-1 8-5 9"/><line x1="12" y1="2" x2="12" y2="6"/></svg>,
  chevron:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  left:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  right:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};


const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: Icon.dashboard, path: '/dashboard' },
  {
    id: 'cadastros', label: 'Cadastros', icon: Icon.register,
    children: [
      {
        label: 'Plano de Contas', section: true,
        children: [
          {
            label: 'Receita', subsection: true,
            children: [
              { label: 'Categoria', path: '/cadastros/categorias' },
              { label: 'Descrição', path: '/cadastros/descricoes' },
            ],
          },
          {
            label: 'Despesa', subsection: true,
            children: [
              { label: 'Grupo',    path: '/cadastros/grupos' },
              { label: 'Subgrupo', path: '/cadastros/subgrupos' },
              { label: 'Item',     path: '/cadastros/itens' },
            ],
          },
        ],
      },
      {
        label: 'Cacau', section: true,
        children: [
          { label: 'Produtor',  path: '/cadastros/produtores' },
          { label: 'Comprador', path: '/cadastros/compradores' },
        ],
      },
      {
        label: 'Gerais', section: true,
        children: [
          { label: 'Projetos', path: '/cadastros/projetos' },
        ],
      },
      {
        label: 'Financeiro', section: true,
        children: [
          { label: 'Fornecedor',      path: '/cadastros/fornecedores' },
          { label: 'Banco',           path: '/cadastros/bancos' },
          { label: 'Conta',           path: '/cadastros/contas' },
          { label: 'Centro de Custo', path: '/cadastros/centros-custo' },
        ],
      },
    ],
  },
  {
    id: 'cacau', label: 'Cacau', icon: Icon.cacau,
    children: [
      { label: 'Controle de Produção', path: '/cacau/producao' },
      { label: 'Cacau a Ordem',        path: '/cacau/ordens' },
    ],
  },
  {
    id: 'financeiro', label: 'Financeiro', icon: Icon.finance,
    children: [
      { label: 'Lançar Despesa',   path: '/despesas',     icon: Icon.expense, color: '#ef4444' },
      { label: 'Lançar Receita',   path: '/receitas',     icon: Icon.income,  color: '#10b981' },
      { label: 'Conciliação',      path: '/conciliacao',   icon: Icon.bank,     color: '#2563eb' },
      { label: 'Transferências',   path: '/transferencias', icon: Icon.transfer, color: '#7c3aed' },
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

/* ── Subseção dentro de seção (3º nível) ── */
function NavSubsection({ sub, onClose }) {
  const location = useLocation();
  const isActive = sub.children?.some(c => location.pathname.startsWith(c.path));
  const [open, setOpen] = useState(isActive);

  useEffect(() => { if (isActive) setOpen(true); }, [location.pathname]);

  return (
    <div className={s.subsection}>
      <button
        className={`${s.subsectionBtn} ${isActive ? s.subsectionBtnActive : ''} ${open ? s.subsectionBtnOpen : ''}`}
        onClick={() => setOpen(p => !p)}
      >
        <span>{sub.label}</span>
        <motion.span
          className={s.chevronSm}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          style={{ display: 'flex', alignItems: 'center' }}
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
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={s.subsectionChildren}>
              {sub.children.map((c, i) => (
                <motion.div key={c.path} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, duration: 0.13 }}>
                  <NavLink to={c.path} className={({ isActive }) => `${s.child} ${isActive ? s.childActive : ''}`} onClick={onClose}>
                    <span className={s.childDot} />
                    <span>{c.label}</span>
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

/* ── Seção dentro de grupo (2º nível com filhos) ── */
function NavSection({ sec, onClose }) {
  const location = useLocation();
  const allPaths = sec.children?.flatMap(s => s.children?.map(c => c.path) ?? [s.path]) ?? [];
  const isActive = allPaths.some(p => p && location.pathname.startsWith(p));
  const [open, setOpen] = useState(isActive);

  useEffect(() => { if (isActive) setOpen(true); }, [location.pathname]);

  return (
    <div className={`${s.section} ${open ? s.sectionOpen : ''}`}>
      <button
        className={`${s.sectionBtn} ${isActive ? s.sectionBtnActive : ''} ${open ? s.sectionBtnOpen : ''}`}
        onClick={() => setOpen(p => !p)}
      >
        <span>{sec.label}</span>
        <motion.span
          className={s.chevronSm}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          style={{ display: 'flex', alignItems: 'center' }}
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
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={s.sectionChildren}>
              {sec.children.map((sub, i) =>
                sub.subsection
                  ? <NavSubsection key={i} sub={sub} onClose={onClose} />
                  : (
                    <motion.div key={sub.path} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, duration: 0.13 }}>
                      <NavLink to={sub.path} className={({ isActive }) => `${s.child} ${isActive ? s.childActive : ''}`} onClick={onClose}>
                        <span className={s.childDot} /><span>{sub.label}</span>
                      </NavLink>
                    </motion.div>
                  )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Grupo colapsável ── */
function NavGroup({ item, collapsed, onClose, isOpen, onToggle }) {
  const location = useLocation();
  const allPaths = item.children?.flatMap(c =>
    c.section ? c.children?.flatMap(s => s.children?.map(x => x.path) ?? [s.path]) ?? []
              : [c.path]
  ) ?? [];
  const isActive = allPaths.some(p => p && location.pathname.startsWith(p));

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
    <div className={`${s.group} ${isOpen ? s.groupOpen : ''}`}>
      <button
        className={`${s.groupBtn} ${isActive || isOpen ? s.groupBtnActive : ''}`}
        onClick={onToggle}
      >
        <span className={s.groupBtnLeft}>
          <span className={s.navIcon}>{item.icon}</span>
          <span className={s.navLabel}>{item.label}</span>
        </span>
        <motion.span
          className={s.chevron}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ display: 'flex', alignItems: 'center', minWidth: 14, flexShrink: 0 }}
        >
          {Icon.chevron}
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={s.groupChildren}>
              {item.children.map((child, i) =>
                child.section
                  ? <NavSection key={i} sec={child} onClose={onClose} />
                  : (
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
                  )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Conteúdo interno do sidebar ── */
function SidebarContent({ collapsed, onToggleCollapse, onMobileClose, isMobile }) {
  const location = useLocation();

  const getActiveGroup = () => {
    for (const item of NAV) {
      if (!item.children) continue;
      const allPaths = item.children.flatMap(c =>
        c.section ? c.children?.flatMap(s => s.children?.map(x => x.path) ?? [s.path]) ?? []
                  : [c.path]
      );
      if (allPaths.some(p => p && location.pathname.startsWith(p))) return item.id;
    }
    return null;
  };

  const [openGroup, setOpenGroup] = useState(() => getActiveGroup());

  useEffect(() => {
    const active = getActiveGroup();
    if (active) setOpenGroup(active);
  }, [location.pathname]);

  const handleToggle = (id) => setOpenGroup(prev => prev === id ? null : id);

  return (
    <>
      {/* ── Brand ── */}
      <div className={`${s.brand} ${collapsed && !isMobile ? s.brandCollapsed : ''}`}>
        <motion.div
          className={s.brandMark}
          whileHover={{ scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        >
          <img src="/logo.png" alt="Cosvar" className={s.brandLogoIcon} />
        </motion.div>

        <AnimatePresence initial={false}>
          {(!collapsed || isMobile) && (
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
          {(!collapsed || isMobile) && !isMobile && (
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

      {/* Botão expandir — só desktop colapsado */}
      <AnimatePresence initial={false}>
        {collapsed && !isMobile && (
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
            if (collapsed && !isMobile) {
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
                  {(!collapsed || isMobile) && <NavLabel>{item.label}</NavLabel>}
                </AnimatePresence>
              </NavLink>
            );
          }
          return (
            <NavGroup
              key={item.id}
              item={item}
              collapsed={collapsed && !isMobile}
              onClose={onMobileClose}
              isOpen={openGroup === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          );
        })}
      </nav>
    </>
  );
}

/* ── Sidebar principal ── */
export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const content = (
    <SidebarContent
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onMobileClose={onMobileClose}
      isMobile={isMobile}
    />
  );

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

      {isMobile ? (
        /* Mobile: aside puro, controlado só por CSS transform */
        <aside className={`${s.sidebar} ${mobileOpen ? s.sidebarMobileOpen : ''}`}>
          {content}
        </aside>
      ) : (
        /* Desktop: Framer Motion controla a largura */
        <motion.aside
          className={s.sidebar}
          initial={false}
          animate={{ width: collapsed ? W_CLOSED : W_OPEN }}
          transition={spring}
        >
          {content}
        </motion.aside>
      )}
    </>
  );
}
