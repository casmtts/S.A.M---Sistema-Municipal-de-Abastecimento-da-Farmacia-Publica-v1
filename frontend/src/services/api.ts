import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const getApiErrorMessage = (error: unknown, fallback = 'Não foi possível concluir a operação. Tente novamente.') => {
  if (!axios.isAxiosError(error)) return fallback;

  const status = error.response?.status;
  if (!error.response) return 'Não foi possível conectar ao servidor. Tente novamente.';

  switch (status) {
    case 400:
    case 422:
      return 'Verifique os dados informados e tente novamente.';
    case 401:
      return 'Não foi possível autenticar ou acessar este recurso.';
    case 403:
      return 'Você não tem permissão para realizar esta ação.';
    case 404:
      return 'O recurso solicitado não foi encontrado.';
    case 409:
      return 'Já existe um cadastro com esses dados.';
    case 500:
    case 502:
    case 503:
      return 'Não foi possível concluir a operação agora. Tente novamente mais tarde.';
    default:
      return fallback;
  }
};

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
