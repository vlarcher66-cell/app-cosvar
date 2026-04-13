import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Injeta token em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cosvar_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para login se 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cosvar_token');
      localStorage.removeItem('cosvar_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
