import { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ToastContainer from '../ui/Toast';
import { useToast } from '../../hooks/useToast';
import s from './MainLayout.module.css';

export const Toast = createContext(null);
export const useGlobalToast = () => useContext(Toast);

const W_OPEN   = 248;
const W_CLOSED = 64;
const spring   = { type: 'spring', stiffness: 320, damping: 30 };

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } },
};

export default function MainLayout() {
  const { isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toast = useToast();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const sideW = collapsed ? W_CLOSED : W_OPEN;
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return (
    <Toast.Provider value={toast}>
      <div className={s.layout}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={() => setCollapsed(p => !p)}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Body acompanha a largura do sidebar com spring */}
        <motion.div
          className={s.body}
          initial={{ marginLeft: isMobile ? 0 : W_OPEN }}
          animate={{ marginLeft: isMobile ? 0 : sideW }}
          transition={spring}
        >
          <Topbar
            onMobileMenu={() => setMobileOpen(p => !p)}
            sidebarCollapsed={collapsed}
            sidebarWidth={sideW}
          />
          <main className={s.main}>
            <motion.div
              key={location.pathname}
              className={s.content}
              variants={pageVariants}
              initial="initial"
              animate="animate"
            >
              <Outlet />
            </motion.div>
          </main>
        </motion.div>

        <ToastContainer toasts={toast.toasts} />
      </div>
    </Toast.Provider>
  );
}
