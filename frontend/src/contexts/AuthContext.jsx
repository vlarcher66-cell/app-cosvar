import { createContext, useContext, useState, useCallback } from 'react';
import api from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cosvar_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha });
    const { token, usuario } = data.data;
    localStorage.setItem('cosvar_token', token);
    localStorage.setItem('cosvar_user', JSON.stringify(usuario));
    setUser(usuario);
    return usuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cosvar_token');
    localStorage.removeItem('cosvar_user');
    setUser(null);
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.perfil === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
