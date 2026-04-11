import axios from 'axios';

// Dynamic API URL: Electron desktop (preload) → Vite env → fallback
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.electronAPI?.apiUrl) {
    return window.electronAPI.apiUrl;
  }
  return import.meta.env.VITE_API_URL || '/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Clear token and user on 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Use window.location.hash instead of href to play nice with HashRouter/Electron
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
